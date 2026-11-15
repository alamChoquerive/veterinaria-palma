"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import { ipDelCliente, verificarRateLimit } from "@/core/rate-limit";
import {
  actualizarPerfilPropioSchema,
  datosTiendaSchema,
  notificacionesSchema,
  crearEmpleadoSchema,
  eliminarUsuarioSchema,
  type ActualizarPerfilPropioInput,
  type DatosTiendaInput,
  type NotificacionesInput,
  type CrearEmpleadoInput,
  type EliminarUsuarioInput,
} from "@/core/actions/schemas";

async function esAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();
  return data?.rol === "admin";
}

/**
 * Actualiza los datos del propio perfil (nombre, apellido, teléfono, foto).
 * El email NO se toca: el trigger proteger_campos_perfil lo bloquea y esta
 * action ni siquiera lo recibe. RLS "perfil propio update" lo permite.
 */
export async function actualizarPerfilPropio(
  input: ActualizarPerfilPropioInput,
): Promise<ActionResult> {
  const parsed = actualizarPerfilPropioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de perfil inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const { nombre, apellido, telefono, fotoUrl } = parsed.data;

  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre,
      apellido,
      telefono: telefono?.trim() || null,
      foto_url: fotoUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[actualizarPerfilPropio] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar el perfil" };
  }

  revalidatePath("/admin/perfil");
  revalidatePath("/empleado/perfil");
  revalidatePath("/cuenta");
  return { ok: true, data: { actualizado: true } };
}

/**
 * Actualiza los datos de la tienda (config_tienda). Solo admin.
 */
export async function actualizarDatosTienda(
  input: DatosTiendaInput,
): Promise<ActionResult> {
  const parsed = datosTiendaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de la tienda inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  if (!(await esAdmin(user.id))) {
    return { ok: false, error: "Solo un administrador puede cambiar los datos de la tienda" };
  }

  const entradas: Array<[string, string]> = [
    ["nombre_tienda", parsed.data.nombreTienda],
    ["cuit", parsed.data.cuit ?? ""],
    ["direccion", parsed.data.direccion ?? ""],
    ["telefono_tienda", parsed.data.telefonoTienda ?? ""],
  ];

  for (const [clave, valor] of entradas) {
    const { error } = await supabase
      .from("config_tienda")
      .update({ valor, updated_at: new Date().toISOString() })
      .eq("clave", clave);
    if (error) {
      console.error("[actualizarDatosTienda] Error:", error.message);
      return { ok: false, error: "No se pudieron guardar los datos de la tienda" };
    }
  }

  revalidatePath("/admin/perfil");
  return { ok: true, data: { actualizado: true } };
}

/**
 * Guarda las preferencias de notificaciones (config_tienda, claves notif_*).
 * Solo admin.
 */
export async function actualizarNotificaciones(
  input: NotificacionesInput,
): Promise<ActionResult> {
  const parsed = notificacionesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Preferencias inválidas" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  if (!(await esAdmin(user.id))) {
    return { ok: false, error: "Solo un administrador puede cambiar las notificaciones" };
  }

  const entradas: Array<[string, string]> = [
    ["notif_stock_bajo", String(parsed.data.stockBajo)],
    ["notif_nuevo_pedido", String(parsed.data.nuevoPedido)],
    ["notif_pago_confirmado", String(parsed.data.pagoConfirmado)],
    ["notif_turno_nuevo", String(parsed.data.turnoNuevo)],
  ];

  for (const [clave, valor] of entradas) {
    const { error } = await supabase
      .from("config_tienda")
      .update({ valor, updated_at: new Date().toISOString() })
      .eq("clave", clave);
    if (error) {
      console.error("[actualizarNotificaciones] Error:", error.message);
      return { ok: false, error: "No se pudieron guardar las notificaciones" };
    }
  }

  revalidatePath("/admin/perfil");
  return { ok: true, data: { actualizado: true } };
}

/**
 * Crea un empleado: usuario de auth (email confirmado, sin email de verificación)
 * + perfil (lo crea el trigger handle_new_user) + rol 'empleado'.
 * Solo admin, con rate limit por IP como el registro público.
 */
export async function crearEmpleado(
  input: CrearEmpleadoInput,
): Promise<ActionResult> {
  const parsed = crearEmpleadoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de empleado inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  if (!(await esAdmin(user.id))) {
    return { ok: false, error: "Solo un administrador puede agregar empleados" };
  }

  const { email, password, nombre, apellido } = parsed.data;

  // Rate limit por IP: 10 altas cada 15 minutos
  const ip = await ipDelCliente();
  const permitido = await verificarRateLimit(`registro:${ip}`, 10, 15 * 60);
  if (!permitido) {
    return {
      ok: false,
      error: "Demasiadas solicitudes. Probá de nuevo en unos minutos.",
    };
  }

  const admin = createAdminClient();

  const { data: nuevoUsuario, error: errorAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // entra directo, sin email de verificación
    user_metadata: { nombre, apellido },
  });

  if (errorAuth || !nuevoUsuario.user) {
    console.error("[crearEmpleado] Error de Auth:", errorAuth?.message);
    const yaExiste =
      errorAuth?.code === "user_already_registered" ||
      (errorAuth?.message ?? "").toLowerCase().includes("already registered");
    return {
      ok: false,
      error: yaExiste
        ? "Ya existe una cuenta con ese email"
        : "No se pudo crear el empleado",
    };
  }

  // Asignar rol empleado (service_role: el trigger no bloquea porque
  // auth.uid() es null fuera de la app)
  const { error: errorRol } = await admin
    .from("perfiles")
    .update({ rol: "empleado", updated_at: new Date().toISOString() })
    .eq("id", nuevoUsuario.user.id);

  if (errorRol) {
    console.error("[crearEmpleado] Error al asignar rol:", errorRol.message);
    // El usuario quedó creado: no fallamos todo, pero avisamos
    return {
      ok: false,
      error: "El usuario se creó pero no se pudo asignar el rol de empleado",
    };
  }

  revalidatePath("/admin/perfil");
  return { ok: true, data: { email } };
}

/**
 * Elimina un usuario del equipo (auth + perfil por cascade).
 * Solo admin; no se puede eliminar a sí mismo ni a otro admin.
 */
export async function eliminarUsuario(
  input: EliminarUsuarioInput,
): Promise<ActionResult> {
  const parsed = eliminarUsuarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ID de usuario inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  if (!(await esAdmin(user.id))) {
    return { ok: false, error: "Solo un administrador puede eliminar usuarios" };
  }

  const { perfilId } = parsed.data;

  if (perfilId === user.id) {
    return { ok: false, error: "No podés eliminar tu propia cuenta" };
  }

  const admin = createAdminClient();
  const { data: perfilObjetivo } = await admin
    .from("perfiles")
    .select("rol, email")
    .eq("id", perfilId)
    .maybeSingle();

  if (!perfilObjetivo) {
    return { ok: false, error: "Usuario no encontrado" };
  }

  if (perfilObjetivo.rol === "admin") {
    return { ok: false, error: "No se puede eliminar a otro administrador" };
  }

  const { error } = await admin.auth.admin.deleteUser(perfilId);
  if (error) {
    console.error("[eliminarUsuario] Error de Auth:", error.message);
    return { ok: false, error: "No se pudo eliminar el usuario" };
  }

  revalidatePath("/admin/perfil");
  return { ok: true, data: { eliminado: true } };
}
