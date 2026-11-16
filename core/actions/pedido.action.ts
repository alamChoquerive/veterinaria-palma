"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import { verificarRateLimit } from "@/core/rate-limit";
import {
  cancelarPedidoSchema,
  crearPedidoSchema,
  type CancelarPedidoInput,
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
    // El detalle queda en el log del servidor; al cliente un mensaje útil
    // cuando la RPC dio un motivo claro (stock/zona/dirección), y genérico
    // para el resto.
    console.error("[crearPedido] Error en la RPC crear_pedido:", error?.message);
    const msg = error?.message ?? "";
    if (msg.includes("Stock insuficiente para ")) {
      const producto = msg.split("Stock insuficiente para ")[1]?.split("\n")[0]?.trim();
      return {
        ok: false,
        error: producto
          ? `Sin stock suficiente para ${producto}. Quitalo o bajá la cantidad.`
          : "Sin stock suficiente para alguno de los productos.",
      };
    }
    if (msg.includes("zona de envío")) {
      return {
        ok: false,
        error: "Este método de envío no está disponible ahora. Elegí retiro en tienda.",
      };
    }
    if (msg.includes("dirección de envío")) {
      return { ok: false, error: "Ingresá la dirección de envío para este método." };
    }
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

/**
 * Cancela un pedido propio que todavía no se pagó (pendiente/pago_pendiente).
 * Lo usa el checkout para "modificar pedido": en vez de crear uno duplicado,
 * se cancela el pendiente y el carrito (que sigue intacto) vuelve al formulario.
 */
export async function cancelarPedidoPropio(
  input: CancelarPedidoInput,
): Promise<ActionResult<{ pedido_id: string }>> {
  const parsed = cancelarPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Pedido inválido",
    };
  }
  const { pedidoId } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const permitido = await verificarRateLimit(`cancelar-pedido:${user.id}`, 10, 60);
  if (!permitido) {
    return { ok: false, error: "Demasiadas solicitudes. Probá de nuevo en unos minutos." };
  }

  // RLS "pedidos propios cancelacion" solo deja pasar
  // estado in ('pendiente','pago_pendiente') -> 'cancelado' del dueño.
  const { data, error } = await supabase
    .from("pedidos")
    .update({ estado: "cancelado" })
    .eq("id", pedidoId)
    .eq("perfil_id", user.id)
    .in("estado", ["pendiente", "pago_pendiente"])
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[cancelarPedidoPropio] Error:", error.message);
    return { ok: false, error: "No se pudo cancelar el pedido." };
  }
  if (!data) {
    return { ok: false, error: "El pedido no está pendiente o no es tuyo." };
  }

  revalidatePath("/cuenta");
  revalidatePath("/admin/dashboard");
  return { ok: true, data: { pedido_id: data.id } };
}
