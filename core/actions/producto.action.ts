"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  actualizarProductoSchema,
  actualizarProductoBasicoSchema,
  type ActualizarProductoInput,
  type ActualizarProductoBasicoInput,
} from "@/core/actions/schemas";

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
 * Actualiza un producto desde el panel admin.
 *
 * Solo un admin puede escribir productos (RLS "productos admin escritura");
 * la action verifica sesión y deja que RLS haga la autorización real.
 * El detalle del error de la DB queda en el log; al cliente va genérico.
 */
export async function actualizarProducto(
  input: ActualizarProductoInput,
): Promise<ActionResult> {
  const parsed = actualizarProductoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de producto inválidos",
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

  const {
    productoId,
    nombre,
    descripcion,
    categoriaId,
    imagenUrl,
    precioMinorista,
    precioMayorista,
    stock,
    stockMinimo,
    activo,
  } = parsed.data;

  const { error } = await supabase
    .from("productos")
    .update({
      nombre,
      descripcion: descripcion ? descripcion : null,
      categoria_id: categoriaId ?? null,
      imagen_url: imagenUrl?.trim() ? imagenUrl.trim() : null,
      precio_minorista: precioMinorista,
      precio_mayorista: precioMayorista,
      stock,
      stock_minimo: stockMinimo,
      activo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productoId);

  if (error) {
    console.error("[actualizarProducto] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar el producto" };
  }

  revalidatePath("/admin/inventario");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/precios");
  revalidatePath("/admin/dashboard");
  revalidatePath("/catalogo");

  return { ok: true, data: { actualizado: true } };
}

/**
 * Edición básica de producto para el empleado: SOLO nombre e imagen.
 * Solo staff (admin o empleado); la escritura la hace la RPC
 * `actualizar_producto_basico` con service_role (migración 0011), así que
 * el empleado no puede tocar precios, stock ni estado aunque quisiera.
 */
export async function actualizarProductoBasico(
  input: ActualizarProductoBasicoInput,
): Promise<ActionResult> {
  const parsed = actualizarProductoBasicoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de producto inválidos",
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

  const rol = await rolDelUsuario(user.id);
  if (!esStaff(rol)) {
    return { ok: false, error: "Solo el personal de la tienda puede editar el catálogo" };
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("actualizar_producto_basico", {
    p_producto_id: parsed.data.productoId,
    p_nombre: parsed.data.nombre,
    p_imagen_url: parsed.data.imagenUrl?.trim() ? parsed.data.imagenUrl.trim() : null,
  });

  if (error) {
    console.error("[actualizarProductoBasico] Error en la RPC:", error.message);
    const mensaje =
      (error as { code?: string }).code === "P0001"
        ? error.message
        : "No se pudo actualizar el producto";
    return { ok: false, error: mensaje };
  }

  revalidatePath("/empleado/catalogo");
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  return { ok: true, data: { actualizado: true } };
}
