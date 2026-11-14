"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  crearProveedorSchema,
  actualizarProveedorSchema,
  type CrearProveedorInput,
  type ActualizarProveedorInput,
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

function filaProveedor(d: CrearProveedorInput) {
  return {
    nombre: d.nombre,
    contacto_nombre: d.contactoNombre?.trim() || null,
    email: d.email?.trim() || null,
    telefono: d.telefono?.trim() || null,
    categoria: d.categoria,
    descripcion: d.descripcion?.trim() || null,
    activo: d.activo,
    monto_pendiente: d.montoPendiente,
    ultimo_pedido_fecha: d.ultimoPedidoFecha || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Crea un proveedor. Solo admin (RLS "proveedores admin escritura" también
 * lo exige; la action verifica sesión y rol con service_role).
 */
export async function crearProveedor(
  input: CrearProveedorInput,
): Promise<ActionResult<{ proveedor_id: string }>> {
  const parsed = crearProveedorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de proveedor inválidos",
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
    return { ok: false, error: "Solo un administrador puede crear proveedores" };
  }

  const { data, error } = await supabase
    .from("proveedores")
    .insert(filaProveedor(parsed.data))
    .select("id")
    .single();

  if (error || !data) {
    console.error("[crearProveedor] Error:", error?.message);
    return { ok: false, error: "No se pudo crear el proveedor" };
  }

  revalidatePath("/admin/proveedores");
  return { ok: true, data: { proveedor_id: data.id } };
}

/**
 * Actualiza un proveedor existente (datos, estado activo y monto pendiente).
 */
export async function actualizarProveedor(
  input: ActualizarProveedorInput,
): Promise<ActionResult> {
  const parsed = actualizarProveedorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de proveedor inválidos",
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
    return { ok: false, error: "Solo un administrador puede editar proveedores" };
  }

  const { proveedorId, ...resto } = parsed.data;
  const { error } = await supabase
    .from("proveedores")
    .update(filaProveedor(resto))
    .eq("id", proveedorId);

  if (error) {
    console.error("[actualizarProveedor] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar el proveedor" };
  }

  revalidatePath("/admin/proveedores");
  return { ok: true, data: { actualizado: true } };
}
