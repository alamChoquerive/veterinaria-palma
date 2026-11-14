"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  actualizarPreciosProductoSchema,
  aplicarMargenGlobalSchema,
  type ActualizarPreciosProductoInput,
  type AplicarMargenGlobalInput,
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
 * Actualiza costo y precios de venta de un producto (sección Precios).
 * Solo admin (RLS "productos admin escritura").
 */
export async function actualizarPreciosProducto(
  input: ActualizarPreciosProductoInput,
): Promise<ActionResult> {
  const parsed = actualizarPreciosProductoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de precio inválidos",
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
    return { ok: false, error: "Solo un administrador puede cambiar precios" };
  }

  const { productoId, precioCosto, precioMinorista, precioMayorista } = parsed.data;

  const { error } = await supabase
    .from("productos")
    .update({
      precio_costo: precioCosto ?? null,
      precio_minorista: precioMinorista,
      precio_mayorista: precioMayorista,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productoId);

  if (error) {
    console.error("[actualizarPreciosProducto] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar el producto" };
  }

  revalidatePath("/admin/precios");
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  return { ok: true, data: { actualizado: true } };
}

/**
 * Aplica un margen porcentual global sobre el precio de costo de todos los
 * productos que tengan costo cargado: precio = costo * (1 + margen/100).
 * También guarda el margen en config_tienda para que la sección lo muestre.
 * Solo admin.
 */
export async function aplicarMargenGlobal(
  input: AplicarMargenGlobalInput,
): Promise<ActionResult<{ actualizados: number }>> {
  const parsed = aplicarMargenGlobalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Margen inválido",
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
    return { ok: false, error: "Solo un administrador puede aplicar márgenes globales" };
  }

  const { tipo, porcentaje } = parsed.data;
  const columna = tipo === "minorista" ? "precio_minorista" : "precio_mayorista";
  const claveConfig = tipo === "minorista" ? "margen_minorista_pct" : "margen_mayorista_pct";

  // Se leen los productos con costo y se actualiza uno por uno con el precio
  // calculado (volumen chico: son los productos del catálogo)
  const { data: productos, error: errorLectura } = await supabase
    .from("productos")
    .select("id, precio_costo")
    .not("precio_costo", "is", null);

  if (errorLectura) {
    console.error("[aplicarMargenGlobal] Error lectura:", errorLectura.message);
    return { ok: false, error: "No se pudieron leer los productos" };
  }

  let actualizados = 0;
  for (const p of productos ?? []) {
    const costo = Number(p.precio_costo);
    if (!costo || costo <= 0) continue;
    const precio = Math.round(costo * (1 + porcentaje / 100) * 100) / 100;
    const { error: errorUpdate } = await supabase
      .from("productos")
      .update({ [columna]: precio, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (!errorUpdate) actualizados += 1;
  }

  // Guardar el margen global en config_tienda
  await supabase
    .from("config_tienda")
    .update({ valor: String(porcentaje), updated_at: new Date().toISOString() })
    .eq("clave", claveConfig);

  revalidatePath("/admin/precios");
  revalidatePath("/admin/catalogo");
  revalidatePath("/catalogo");
  revalidatePath("/admin/dashboard");

  return { ok: true, data: { actualizados } };
}
