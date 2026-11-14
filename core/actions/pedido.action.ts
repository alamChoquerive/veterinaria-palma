"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import { verificarRateLimit } from "@/core/rate-limit";
import {
  crearPedidoSchema,
  type CrearPedidoInput,
} from "@/core/actions/schemas";

type CrearPedidoResultado = {
  pedido_id: string;
  subtotal: number;
  costo_envio: number;
  total: number;
};

/**
 * Crea un pedido de forma transaccional en el servidor.
 *
 * Los precios, el costo de envío y el total NUNCA vienen del cliente:
 * la RPC `crear_pedido` (ejecutada con service_role) los calcula en la
 * base de datos según el rol del usuario y la tabla `zonas_envio`, y
 * descuenta el stock de forma atómica. El perfil del pedido es siempre
 * el del usuario autenticado.
 */
export async function crearPedido(
  input: CrearPedidoInput,
): Promise<ActionResult<CrearPedidoResultado>> {
  const parsed = crearPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de pedido inválidos",
    };
  }

  const { metodoEntrega, direccionEnvio, items } = parsed.data;

  // 1) Sesión del usuario con el client normal (RLS aplica)
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  // Rate limit por usuario: 10 pedidos por minuto
  const permitido = await verificarRateLimit(`pedido:${user.id}`, 10, 60);
  if (!permitido) {
    return {
      ok: false,
      error: "Demasiadas solicitudes. Probá de nuevo en unos minutos.",
    };
  }

  // 2) La creación la hace la RPC con service_role: el servidor es la
  //    única fuente de verdad de precios, envío y stock.
  const admin = createAdminClient();
  const direccion = direccionEnvio?.trim() ? direccionEnvio.trim() : null;

  const { data, error } = await admin.rpc("crear_pedido", {
    p_perfil_id: user.id,
    p_metodo_entrega: metodoEntrega,
    p_direccion_envio: direccion,
    p_items: items.map((i) => ({
      producto_id: i.productoId,
      cantidad: i.cantidad,
    })),
  });

  if (error || !data) {
    // El detalle queda en el log del servidor; al cliente un mensaje genérico
    console.error("[crearPedido] Error en la RPC crear_pedido:", error?.message);
    return {
      ok: false,
      error: "No se pudo crear el pedido. Intentá de nuevo.",
    };
  }

  const resultado = data as CrearPedidoResultado;

  revalidatePath("/carrito");
  revalidatePath("/admin/dashboard");

  return {
    ok: true,
    data: {
      pedido_id: resultado.pedido_id,
      subtotal: resultado.subtotal,
      costo_envio: resultado.costo_envio,
      total: resultado.total,
    },
  };
}
