"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  crearPedidoSchema,
  type CrearPedidoInput,
} from "@/core/actions/schemas";

/**
 * Crea un pedido con sus ítems y registra el pago pendiente.
 */
export async function crearPedido(
  input: CrearPedidoInput,
): Promise<ActionResult> {
  const parsed = crearPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de pedido inválidos",
    };
  }

  const { metodoEntrega, direccionEnvio, costoEnvio, total, items, perfilId } =
    parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  // Usar el perfil del usuario autenticado si no se pasa uno explícito
  const perfil_id = perfilId ?? user.id;

  // Crear el pedido
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      perfil_id,
      estado: "pago_pendiente",
      metodo_entrega: metodoEntrega,
      direccion_envio: direccionEnvio ?? null,
      costo_envio: costoEnvio,
      total,
    })
    .select()
    .single();

  if (pedidoError || !pedido) {
    return {
      ok: false,
      error: pedidoError?.message ?? "Error al crear el pedido",
    };
  }

  // Crear los ítems del pedido
  const itemsConPedido = items.map((item) => ({
    pedido_id: pedido.id,
    producto_id: item.productoId,
    cantidad: item.cantidad,
    precio_unitario: item.precioUnitario,
    subtotal: item.subtotal,
  }));

  const { error: itemsError } = await supabase
    .from("pedido_items")
    .insert(itemsConPedido);

  if (itemsError) {
    // Si fallan los ítems, borramos el pedido para no dejar datos huérfanos
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    return { ok: false, error: itemsError.message };
  }

  revalidatePath("/carrito");
  revalidatePath("/admin/dashboard");

  return {
    ok: true,
    data: { pedidoId: pedido.id, estado: pedido.estado },
  };
}
