import { createAdminClient } from "@/core/supabase/admin";

/**
 * Lógica compartida de procesamiento de pagos de Mercado Pago.
 *
 * La usan DOS caminos, ambos server-side:
 *  - el webhook /api/webhooks/mercadopago (después de verificar la firma)
 *  - la página /checkout/exito al volver del checkout (en local el webhook
 *    de MP no puede llegar a localhost, así que el pago se verifica acá)
 *
 * En ambos casos la fuente de verdad SIEMPRE es la API de MP
 * (GET /v1/payments/{id}); nunca se confía en datos que vienen del cliente.
 */

export interface PagoMP {
  status: string;
  external_reference?: string | null;
  transaction_details?: { total_paid_amount?: number };
}

/** Error al consultar la API de MP (red o HTTP != 200). El webhook responde 502 para que MP reintente. */
export class ErrorConsultaMP extends Error {}

export async function consultarPagoMP(paymentId: string): Promise<PagoMP> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new ErrorConsultaMP("Falta MERCADOPAGO_ACCESS_TOKEN");
  }
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new ErrorConsultaMP(
      `No se pudo consultar el pago ${paymentId}: HTTP ${res.status}`,
    );
  }
  return (await res.json()) as PagoMP;
}

export interface ResultadoPagoMP {
  paymentId: string;
  status: string;
  externalReference: string | null;
  pedidoId: string | null;
  /** Estado del pedido DESPUÉS de procesar (null si no hay pedido referenciado) */
  estadoPedido: string | null;
  montoPagado: number;
  totalPedido: number | null;
  /** Solo si status === "approved": si el monto pagado coincide con el total del pedido */
  montoCoincide: boolean | null;
}

/**
 * Procesa un pago de MP: lo consulta en la API, registra el pago en la tabla
 * `pagos` (idempotente por proveedor_pago_id) y avanza el estado del pedido
 * referenciado (solo hacia adelante: pagado si approved y el monto coincide;
 * cancelado si rejected/cancelled).
 *
 * Devuelve null si el pago no tiene external_reference o referencia un
 * pedido inexistente (nada que hacer).
 */
export async function procesarPagoMP(
  paymentId: string,
): Promise<ResultadoPagoMP | null> {
  const pago = await consultarPagoMP(paymentId);

  const status = pago.status;
  const externalReference = pago.external_reference ?? null;
  const montoPagado = pago.transaction_details?.total_paid_amount ?? 0;

  const base = {
    paymentId,
    status,
    externalReference,
    montoPagado,
  };

  if (!externalReference) {
    return { ...base, pedidoId: null, estadoPedido: null, totalPedido: null, montoCoincide: null };
  }

  const admin = createAdminClient();

  const { data: pedido, error: pedidoError } = await admin
    .from("pedidos")
    .select("id, estado, total")
    .eq("id", externalReference)
    .maybeSingle();

  if (pedidoError) {
    throw new Error("Error buscando el pedido: " + pedidoError.message);
  }
  if (!pedido) {
    return { ...base, pedidoId: null, estadoPedido: null, totalPedido: null, montoCoincide: null };
  }

  // Registrar el pago (idempotente por proveedor_pago_id)
  const { data: pagoExistente } = await admin
    .from("pagos")
    .select("id")
    .eq("proveedor_pago_id", paymentId)
    .maybeSingle();

  if (!pagoExistente) {
    const { error: pagoError } = await admin.from("pagos").insert({
      pedido_id: pedido.id,
      proveedor: "mercadopago",
      proveedor_pago_id: paymentId,
      estado: status,
      monto: montoPagado,
      raw: pago,
    });
    if (pagoError && (pagoError as { code?: string }).code !== "23505") {
      // 23505 = unique violation (reintento concurrente): ya quedó registrado
      throw new Error("Error registrando el pago: " + pagoError.message);
    }
  }

  let estadoPedido: string = pedido.estado;
  let montoCoincide: boolean | null = null;

  if (status === "approved") {
    const coincide = Math.abs(montoPagado - Number(pedido.total)) < 0.01;
    montoCoincide = coincide;
    if (!coincide) {
      console.error(
        `[pago-mp] Pago ${paymentId} aprobado pero monto ${montoPagado} != total del pedido ${pedido.total}`,
      );
    }
    const nuevoEstado = coincide ? "pagado" : "pago_pendiente";
    const { data: upd, error: updError } = await admin
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedido.id)
      .in("estado", ["pendiente", "pago_pendiente"])
      .select("estado")
      .maybeSingle();
    if (updError) {
      throw new Error("Error actualizando el pedido: " + updError.message);
    }
    if (upd) estadoPedido = upd.estado;
  } else if (status === "rejected" || status === "cancelled") {
    const { data: upd, error: updError } = await admin
      .from("pedidos")
      .update({ estado: "cancelado" })
      .eq("id", pedido.id)
      .in("estado", ["pendiente", "pago_pendiente"])
      .select("estado")
      .maybeSingle();
    if (updError) {
      throw new Error("Error actualizando el pedido: " + updError.message);
    }
    if (upd) estadoPedido = upd.estado;
  }
  // "pending" / "in_process" / otros: el pedido ya quedó en "pago_pendiente".

  return {
    ...base,
    pedidoId: pedido.id,
    estadoPedido,
    totalPedido: Number(pedido.total),
    montoCoincide,
  };
}
