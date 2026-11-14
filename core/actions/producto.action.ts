"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  actualizarProductoSchema,
  type ActualizarProductoInput,
} from "@/core/actions/schemas";

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
  revalidatePath("/admin/dashboard");
  revalidatePath("/catalogo");

  return { ok: true, data: { actualizado: true } };
}
