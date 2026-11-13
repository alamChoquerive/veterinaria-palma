import { NextResponse } from "next/server";
import { createAdminClient } from "@/core/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();

  // TODO: validar firma del webhook de Mercado Pago
  const admin = createAdminClient();
  await admin.from("pagos").insert({
    proveedor_pago_id: body.data?.id,
    estado: body.status,
    monto: body.transaction_details?.total_paid_amount ?? 0,
    raw: body,
  });

  return NextResponse.json({ received: true });
}
