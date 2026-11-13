import { NextResponse } from "next/server";
import { createAdminClient } from "@/core/supabase/admin";

/**
 * Webhook de Mercado Pago.
 * Recibe notificaciones de pagos y actualiza el estado del pedido en Supabase.
 */
export async function POST(request: Request) {
  const body = await request.json();

  // Extraer datos del webhook de Mercado Pago
  const paymentId = body.data?.id ?? body.id;
  const status = body.status ?? body.payment?.status;
  const externalReference = body.external_reference ?? body.payment?.external_reference;

  if (!paymentId || !status) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const admin = createAdminClient() as any;

  try {
    // Registrar el pago en la tabla pagos
    await admin.from("pagos").insert({
      proveedor_pago_id: paymentId,
      estado: status,
      monto: body.transaction_details?.total_paid_amount ?? 0,
      raw: body,
    });

    // Actualizar el estado del pedido si tenemos referencia externa
    if (externalReference) {
      let nuevoEstado: string;
      switch (status) {
        case "approved":
          nuevoEstado = "pagado";
          break;
        case "rejected":
          nuevoEstado = "cancelado";
          break;
        case "pending":
          nuevoEstado = "pago_pendiente";
          break;
        default:
          nuevoEstado = "pago_pendiente";
      }

      await admin.from("pedidos").update({ estado: nuevoEstado }).eq("id", externalReference);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
