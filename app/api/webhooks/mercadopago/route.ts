import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/core/supabase/admin";

/**
 * Webhook de Mercado Pago.
 *
 * Seguridad:
 *  1. Si MERCADOPAGO_WEBHOOK_SECRET está configurado, se verifica la firma
 *     x-signature (HMAC-SHA256 del manifest de MP) con comparación de tiempo
 *     constante. Soporta rotación de secretos (varios v1 en el header).
 *  2. SIEMPRE se consulta el pago real en la API de Mercado Pago
 *     (GET /v1/payments/{id}); nunca se confía en el body del webhook.
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

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const b = body as Record<string, any>;

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

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[webhook MP] Falta MERCADOPAGO_ACCESS_TOKEN");
    return NextResponse.json(
      { error: "Configuración de pago no disponible" },
      { status: 500 },
    );
  }

  // 2) Fuente de verdad: el pago real en la API de Mercado Pago
  let pago: Record<string, any>;
  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentIdStr)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      console.error(
        `[webhook MP] No se pudo consultar el pago ${paymentIdStr}: HTTP ${res.status}`,
      );
      // 502 para que MP reintente la notificación más tarde
      return NextResponse.json(
        { error: "No se pudo verificar el pago" },
        { status: 502 },
      );
    }
    pago = await res.json();
  } catch (e) {
    console.error("[webhook MP] Error consultando la API de MP:", e);
    return NextResponse.json(
      { error: "No se pudo verificar el pago" },
      { status: 502 },
    );
  }

  const status: string = pago.status;
  const externalReference: string | null = pago.external_reference ?? null;
  const montoPagado: number =
    pago.transaction_details?.total_paid_amount ?? 0;

  if (!externalReference) {
    return NextResponse.json({
      received: true,
      ignored: "sin external_reference",
    });
  }

  const admin = createAdminClient();

  // 3) Buscar el pedido referenciado
  const { data: pedido, error: pedidoError } = await admin
    .from("pedidos")
    .select("id, estado, total")
    .eq("id", externalReference)
    .maybeSingle();

  if (pedidoError) {
    console.error("[webhook MP] Error buscando el pedido:", pedidoError.message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
  if (!pedido) {
    // Referencia desconocida: 200 para que MP no reintente infinitamente.
    return NextResponse.json({
      received: true,
      ignored: "pedido no encontrado",
    });
  }

  // 4) Registrar el pago (idempotente por proveedor_pago_id)
  const { data: pagoExistente } = await admin
    .from("pagos")
    .select("id")
    .eq("proveedor_pago_id", paymentIdStr)
    .maybeSingle();

  if (!pagoExistente) {
    const { error: pagoError } = await admin.from("pagos").insert({
      pedido_id: pedido.id,
      proveedor: "mercadopago",
      proveedor_pago_id: paymentIdStr,
      estado: status,
      monto: montoPagado,
      raw: pago,
    });
    if (pagoError) {
      // 23505 = unique violation (reintento concurrente): ya quedó registrado.
      if ((pagoError as { code?: string }).code !== "23505") {
        console.error("[webhook MP] Error registrando el pago:", pagoError.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
      }
    }
  }

  // 5) Transición de estado del pedido (solo hacia adelante)
  if (status === "approved") {
    // Solo marcar "pagado" si el monto recibido coincide con el total del pedido
    const coincide = Math.abs(montoPagado - pedido.total) < 0.01;
    if (!coincide) {
      console.error(
        `[webhook MP] Pago ${paymentIdStr} aprobado pero monto ${montoPagado} != total del pedido ${pedido.total}`,
      );
    }
    const nuevoEstado = coincide ? "pagado" : "pago_pendiente";
    const { error: updError } = await admin
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedido.id)
      .in("estado", ["pendiente", "pago_pendiente"]);
    if (updError) {
      console.error("[webhook MP] Error actualizando el pedido:", updError.message);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
  } else if (status === "rejected" || status === "cancelled") {
    const { error: updError } = await admin
      .from("pedidos")
      .update({ estado: "cancelado" })
      .eq("id", pedido.id)
      .in("estado", ["pendiente", "pago_pendiente"]);
    if (updError) {
      console.error("[webhook MP] Error actualizando el pedido:", updError.message);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
  }
  // "pending" / "in_process" / otros: el pedido ya quedó en "pago_pendiente".

  return NextResponse.json({ received: true });
}
