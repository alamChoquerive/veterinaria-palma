import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import {
  procesarPagoMP,
  ErrorConsultaMP,
} from "@/core/services/pago-mp.service";

/**
 * Webhook de Mercado Pago.
 *
 * Seguridad:
 *  1. Si MERCADOPAGO_WEBHOOK_SECRET está configurado, se verifica la firma
 *     x-signature (HMAC-SHA256 del manifest de MP) con comparación de tiempo
 *     constante. Soporta rotación de secretos (varios v1 en el header).
 *  2. SIEMPRE se consulta el pago real en la API de Mercado Pago
 *     (GET /v1/payments/{id}) — ver core/services/pago-mp.service.ts; nunca
 *     se confía en el body del webhook.
 *  3. Solo se marca como "pagado" si el monto recibido coincide con el total
 *     del pedido guardado en la base.
 *  4. Idempotente: un mismo payment id no se registra dos veces.
 *  5. Las transiciones de estado solo avanzan: nunca se degrada un pedido
 *     que ya está pagado.
 */

function verificarFirmaMP(
  request: Request,
  paymentId: string,
  secret: string,
): boolean {
  const header = request.headers.get("x-signature");
  if (!header) return false;

  let ts = "";
  const firmas: string[] = [];
  for (const parte of header.split(",")) {
    const idx = parte.indexOf("=");
    if (idx === -1) continue;
    const k = parte.slice(0, idx).trim();
    const v = parte.slice(idx + 1).trim();
    if (k === "ts") ts = v;
    else if (k === "v1") firmas.push(v);
  }
  if (!ts || firmas.length === 0) return false;

  const url = new URL(request.url);
  const requestTarget = `${url.pathname}${url.search}`;
  const manifest = `id:${paymentId};request-target:${requestTarget};ts:${ts};`;
  const esperado = createHmac("sha256", secret).update(manifest).digest("hex");

  return firmas.some((firma) => {
    const a = Buffer.from(esperado, "hex");
    const b = Buffer.from(firma, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

type NotificacionMP = {
  type?: string;
  id?: string | number;
  data?: { id?: string | number };
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const b = body as NotificacionMP;

  // Mercado Pago envía varios tipos de notificación; solo procesamos pagos.
  if (b?.type && b.type !== "payment") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const paymentId = b?.data?.id ?? b?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }
  const paymentIdStr = String(paymentId);

  // 1) Firma del webhook (si hay secret configurado)
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (
    webhookSecret &&
    !verificarFirmaMP(request, paymentIdStr, webhookSecret)
  ) {
    console.error(`[webhook MP] Firma inválida para payment ${paymentIdStr}`);
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // 2) Procesar el pago consultando la API de MP (lógica compartida con
  //    /checkout/exito): 502 si no se pudo verificar, para que MP reintente.
  let resultado;
  try {
    resultado = await procesarPagoMP(paymentIdStr);
  } catch (e) {
    console.error("[webhook MP] Error procesando el pago:", e);
    const reintentar = e instanceof ErrorConsultaMP;
    return NextResponse.json(
      { error: "No se pudo verificar el pago" },
      { status: reintentar ? 502 : 500 },
    );
  }

  if (!resultado) {
    // Sin external_reference o pedido desconocido: 200 para que MP no reintente.
    return NextResponse.json({ received: true, ignored: true });
  }

  return NextResponse.json({
    received: true,
    status: resultado.status,
    pedido: resultado.pedidoId,
    estadoPedido: resultado.estadoPedido,
  });
}
