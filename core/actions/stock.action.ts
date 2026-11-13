"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  actualizarStockSchema,
  type ActualizarStockInput,
} from "@/core/actions/schemas";

/**
 * Actualiza el stock de un producto (positivo para sumar, negativo para restar).
 * Solo administradores.
 */
export async function actualizarStock(
  input: ActualizarStockInput,
): Promise<ActionResult> {
  const parsed = actualizarStockSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Datos de stock inválidos",
    };
  }

  const { productoId, cantidad } = parsed.data;

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
    .eq("id", productoId)
    .single();

  if (productoError || !producto) {
    return { ok: false, error: "Producto no encontrado" };
  }

  const nuevoStock = Math.max(0, (producto.stock as number) + cantidad);

  const { error } = await supabase
    .from("productos")
    .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
    .eq("id", productoId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
  return { ok: true, data: { nuevoStock } };
}
