"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import { ipDelCliente, verificarRateLimit } from "@/core/rate-limit";
import {
  crearTurnoSchema,
  crearTurnoPresencialSchema,
  fechaTurnoSchema,
  type CrearTurnoInput,
  type CrearTurnoPresencialInput,
  type FechaTurnoInput,
} from "@/core/actions/schemas";

/**
 * Lee el rol del usuario autenticado con service_role (server-side),
 * sin depender de que la sesión se propague a una query RLS.
 */
async function rolDelUsuario(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();
  return data?.rol ?? null;
}

function esStaff(rol: string | null): boolean {
  return rol === "admin" || rol === "empleado";
}

/**
 * Disponibilidad de turnos para un día: devuelve las horas de inicio ya
 * ocupadas por turnos ACTIVOS (estado <> 'cancelado'; el índice parcial
 * turnos_slot_activo_unico garantiza que no hay dos activos en el mismo slot).
 *
 * Es pública (no exige sesión) porque el calendario online muestra disponibilidad
 * antes de pedir login; solo expone hora_inicio, nunca datos del cliente.
 * Rate limit por IP para que no se use como oráculo de ocupación masiva.
 */
export async function obtenerDisponibilidadTurnos(
  input: FechaTurnoInput,
): Promise<ActionResult<{ fecha: string; ocupados: string[] }>> {
  const parsed = fechaTurnoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Fecha inválida",
    };
  }
  const { fecha } = parsed.data;

  const ip = await ipDelCliente();
  const permitido = await verificarRateLimit(`disponibilidad-turnos:${ip}`, 60, 60);
  if (!permitido) {
    return { ok: false, error: "Demasiadas consultas. Probá de nuevo en un rato." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("turnos")
    .select("hora_inicio")
    .eq("fecha", fecha)
    .neq("estado", "cancelado");

  if (error) {
    console.error("[obtenerDisponibilidadTurnos] Error:", error.message);
    return { ok: false, error: "No se pudo consultar la disponibilidad" };
  }

  const ocupados = (data ?? [])
    .map((t) => String(t.hora_inicio).slice(0, 5))
    .sort();

  return { ok: true, data: { fecha, ocupados } };
}

/**
 * Normaliza los campos opcionales de texto a null para la RPC
 * (la DB guarda null, no string vacío).
 */
function limpio(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : null;
}

/**
 * Crea un turno para el cliente autenticado (reserva online).
 *
 * Toda la validación de negocio (fecha futura, horario de atención,
 * intervalo, solapamiento, límite por día) la hace la RPC `crear_turno`
 * con service_role, nunca el cliente.
 */
export async function crearTurno(
  datos: CrearTurnoInput,
): Promise<ActionResult<{ turno_id: string }>> {
  const parsed = crearTurnoSchema.safeParse(datos);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de turno inválidos",
    };
  }

  const {
    fecha,
    horaInicio,
    horaFin,
    motivo,
    especialidad,
    mascotaNombre,
    mascotaEspecie,
    responsableNombre,
    responsableTelefono,
  } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  // Rate limit por usuario: 5 intentos de reserva cada 5 minutos
  const permitido = await verificarRateLimit(`turno:${user.id}`, 5, 5 * 60);
  if (!permitido) {
    return {
      ok: false,
      error: "Demasiadas solicitudes. Probá de nuevo en unos minutos.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("crear_turno", {
    p_perfil_id: user.id,
    p_fecha: fecha,
    p_hora_inicio: horaInicio,
    p_hora_fin: horaFin,
    p_motivo: limpio(motivo),
    p_especialidad: limpio(especialidad),
    p_mascota_nombre: limpio(mascotaNombre),
    p_mascota_especie: limpio(mascotaEspecie),
    p_responsable_nombre: limpio(responsableNombre),
    p_responsable_telefono: limpio(responsableTelefono),
  });

  if (error || !data) {
    console.error("[crearTurno] Error en la RPC crear_turno:", error?.message);
    // Los errores P0001 son validaciones de negocio de la RPC (mensaje nuestro)
    const mensaje =
      (error as { code?: string } | null)?.code === "P0001"
        ? (error?.message ?? "No se pudo crear el turno")
        : "No se pudo crear el turno. Intentá de nuevo.";
    return { ok: false, error: mensaje };
  }

  revalidatePath("/turnos");
  return {
    ok: true,
    data: { turno_id: (data as { turno_id: string }).turno_id },
  };
}

/**
 * Crea un turno presencial desde el panel (sin cuenta de cliente).
 * Solo staff (admin o empleado); la RPC (service_role) valida
 * fecha/horario/solapamiento y exige el responsable cuando no hay perfil.
 */
export async function crearTurnoPresencial(
  datos: CrearTurnoPresencialInput,
): Promise<ActionResult<{ turno_id: string }>> {
  const parsed = crearTurnoPresencialSchema.safeParse(datos);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de turno inválidos",
    };
  }

  const {
    fecha,
    horaInicio,
    horaFin,
    especialidad,
    mascotaNombre,
    mascotaEspecie,
    responsableNombre,
    responsableTelefono,
    motivo,
  } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const rol = await rolDelUsuario(user.id);
  if (!esStaff(rol)) {
    return { ok: false, error: "Solo el personal de la tienda puede crear turnos presenciales" };
  }

  // Rate limit por usuario: 5 turnos cada 5 minutos
  const permitido = await verificarRateLimit(`turno:${user.id}`, 5, 5 * 60);
  if (!permitido) {
    return {
      ok: false,
      error: "Demasiadas solicitudes. Probá de nuevo en unos minutos.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("crear_turno", {
    p_perfil_id: null, // presencial: sin cuenta
    p_fecha: fecha,
    p_hora_inicio: horaInicio,
    p_hora_fin: horaFin,
    p_motivo: limpio(motivo),
    p_especialidad: limpio(especialidad),
    p_mascota_nombre: limpio(mascotaNombre),
    p_mascota_especie: limpio(mascotaEspecie),
    p_responsable_nombre: limpio(responsableNombre),
    p_responsable_telefono: limpio(responsableTelefono),
  });

  if (error || !data) {
    console.error(
      "[crearTurnoPresencial] Error en la RPC crear_turno:",
      error?.message,
    );
    const mensaje =
      (error as { code?: string } | null)?.code === "P0001"
        ? (error?.message ?? "No se pudo crear el turno")
        : "No se pudo crear el turno. Intentá de nuevo.";
    return { ok: false, error: mensaje };
  }

  revalidatePath("/admin/turnos");
  return {
    ok: true,
    data: { turno_id: (data as { turno_id: string }).turno_id },
  };
}

/**
 * Cancela un turno. RLS define quién puede: el dueño o un admin.
 * Solo se pueden cancelar turnos activos (pendiente/confirmado).
 */
export async function cancelarTurno(turnoId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const { error } = await supabase
    .from("turnos")
    .update({ estado: "cancelado" })
    .eq("id", turnoId)
    .in("estado", ["pendiente", "confirmado"]);

  if (error) {
    console.error("[cancelarTurno] Error:", error.message);
    return { ok: false, error: "No se pudo cancelar el turno" };
  }

  revalidatePath("/turnos");
  revalidatePath("/cuenta");
  revalidatePath("/admin/turnos");
  return { ok: true, data: { cancelado: true } };
}

/**
 * Cambia el estado de un turno desde el panel
 * (confirmar, marcar atendido, cancelar). Solo staff (admin o empleado):
 * RLS dejaría también al dueño, pero esta action es exclusiva del panel.
 */
export async function actualizarEstadoTurno(
  turnoId: string,
  estado: "pendiente" | "confirmado" | "atendido" | "cancelado",
): Promise<ActionResult> {
  if (!["pendiente", "confirmado", "atendido", "cancelado"].includes(estado)) {
    return { ok: false, error: "Estado inválido" };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const rol = await rolDelUsuario(user.id);
  if (!esStaff(rol)) {
    return { ok: false, error: "Solo el personal de la tienda puede cambiar el estado de un turno" };
  }

  const { error } = await supabase
    .from("turnos")
    .update({ estado })
    .eq("id", turnoId);

  if (error) {
    console.error("[actualizarEstadoTurno] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar el turno" };
  }

  revalidatePath("/admin/turnos");
  revalidatePath("/turnos");
  return { ok: true, data: { estado } };
}
