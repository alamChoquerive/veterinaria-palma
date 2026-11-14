"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  crearTurnoSchema,
  type CrearTurnoInput,
} from "@/core/actions/schemas";

/**
 * Crea un turno para el cliente autenticado.
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

  const { fecha, horaInicio, horaFin, motivo } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("crear_turno", {
    p_perfil_id: user.id,
    p_fecha: fecha,
    p_hora_inicio: horaInicio,
    p_hora_fin: horaFin,
    p_motivo: motivo ?? null,
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
 * Cancela un turno (solo el dueño o un admin).
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
    .eq("perfil_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/turnos");
  revalidatePath("/admin/agenda");
  return { ok: true, data: { cancelado: true } };
}
