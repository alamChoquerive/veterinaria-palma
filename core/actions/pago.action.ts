"use server";

import type { ActionResult } from "@/types/api";

/**
 * Crea una preferencia de pago en Mercado Pago.
 * Devuelve la URL de inicio de pago (init_point) para redirigir al usuario.
 */
export async function crearPreferenciaPago({
  pedidoId,
  total,
  descripcion,
}: {
  pedidoId: string;
  total: number;
  descripcion: string;
}): Promise<ActionResult> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return {
      ok: false,
      error: "Configuración de pago no disponible",
    };
  }

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: pedidoId,
            title: descripcion,
            quantity: 1,
            currency_id: "ARS",
            unit_price: total,
          },
        ],
        external_reference: pedidoId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/exito`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/fallo`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/fallo`,
        },
        auto_return: "approved",
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.init_point) {
      return {
        ok: false,
        error: data.message ?? "Error al crear la preferencia de pago",
      };
    }

    return { ok: true, data: { initPoint: data.init_point } };
  } catch {
    return { ok: false, error: "Error de conexión con Mercado Pago" };
  }
}
