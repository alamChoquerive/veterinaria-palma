"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult, ActualizarStockInput } from "@/types/api";
import { revalidatePath } from "next/cache";

/**
 * Actualiza el stock de un producto (positivo para sumar, negativo para restar).
 * Solo administradores.
 */
export async function actualizarStock(input: ActualizarStockInput): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  // Verificar rol admin
  const { data: perfil, error: perfilError } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (perfilError || perfil?.rol !== "admin") {
    return { ok: false, error: "Solo administradores pueden modificar el stock" };
  }

  // Obtener stock actual
  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .select("stock")
    .eq("id", input.productoId)
    .single();

  if (productoError || !producto) {
    return { ok: false, error: "Producto no encontrado" };
  }

  const nuevoStock = Math.max(0, (producto.stock as number) + input.cantidad);

  const { error } = await supabase
    .from("productos")
    .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
    .eq("id", input.productoId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
  return { ok: true, data: { nuevoStock } };
}
