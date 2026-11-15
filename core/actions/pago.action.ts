"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import {
  preferenciaPagoSchema,
  type PreferenciaPagoInput,
} from "@/core/actions/schemas";

/**
 * Devuelve la origin de la URL si es PÚBLICA (https y no localhost):
 * Mercado Pago rechaza notification_url apuntando a localhost/127.0.0.1
 * porque sus servidores no pueden llegar a nuestra máquina en local.
 * En ese caso se omite la notification_url y el pago se verifica al
 * volver de MP en /checkout/exito (consulta directa a la API de MP).
 */
function urlPublica(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Crea una preferencia de pago en Mercado Pago para un pedido propio.
 *
 * El monto NUNCA viene del cliente: se lee de `pedidos.total` en la base
 * de datos (calculado por la RPC crear_pedido). Además se verifica que el
 * pedido pertenezca al usuario autenticado y esté en estado "pago_pendiente".
 */
export async function crearPreferenciaPago(
  input: PreferenciaPagoInput,
): Promise<ActionResult<{ initPoint: string }>> {
  const parsed = preferenciaPagoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de pago inválidos",
    };
  }
  const { pedidoId } = parsed.data;

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("[crearPreferenciaPago] Falta MERCADOPAGO_ACCESS_TOKEN");
    return { ok: false, error: "Configuración de pago no disponible" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  // RLS limita la lectura a los pedidos propios
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("id, perfil_id, estado, total")
    .eq("id", pedidoId)
    .maybeSingle();

  if (pedidoError || !pedido) {
    return { ok: false, error: "Pedido no encontrado" };
  }
  if (pedido.perfil_id !== user.id) {
    return { ok: false, error: "No tenés permiso para pagar este pedido" };
  }
  if (pedido.estado !== "pago_pendiente") {
    return { ok: false, error: "Este pedido ya no está pendiente de pago" };
  }

  // Fuente de verdad del monto: la base de datos, no el cliente
  const total = pedido.total;

  // En local (localhost) MP no acepta notification_url: se omite y el pago
  // se verifica al volver a /checkout/exito. En producción (https público)
  // sí se envía y el webhook confirma la operación.
  const appUrl = urlPublica(process.env.NEXT_PUBLIC_APP_URL);
  const baseUrl = appUrl ?? "http://localhost:3000";
  if (!appUrl) {
    console.warn(
      "[crearPreferenciaPago] NEXT_PUBLIC_APP_URL no es una URL pública: " +
        "se omite notification_url (el webhook no llega en local; el pago se verifica en /checkout/exito)",
    );
  }

  const preferencia: Record<string, unknown> = {
    items: [
      {
        id: pedido.id,
        title:
          "Compra en Veterinaria Palma - Pedido #" + pedido.id.slice(0, 8),
        quantity: 1,
        currency_id: "ARS",
        unit_price: total,
      },
    ],
    external_reference: pedido.id,
    back_urls: {
      success: `${baseUrl}/checkout/exito`,
      failure: `${baseUrl}/checkout/fallo`,
      pending: `${baseUrl}/checkout/fallo`,
    },
    auto_return: "approved",
  };
  if (appUrl) {
    preferencia.notification_url = `${appUrl}/api/webhooks/mercadopago`;
  }

  try {
    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferencia),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.init_point) {
      console.error(
        "[crearPreferenciaPago] MP devolvió error:",
        response.status,
        JSON.stringify(data).slice(0, 500),
      );
      return {
        ok: false,
        error: "No se pudo iniciar el pago. Intentá de nuevo.",
      };
    }

    // Defensa en profundidad: solo redirigimos a URLs https
    if (
      typeof data.init_point !== "string" ||
      !data.init_point.startsWith("https://")
    ) {
      console.error("[crearPreferenciaPago] init_point inválido recibido de MP");
      return { ok: false, error: "Respuesta de pago inválida" };
    }

    return { ok: true, data: { initPoint: data.init_point } };
  } catch (e) {
    console.error("[crearPreferenciaPago] Error de conexión con MP:", e);
    return { ok: false, error: "Error de conexión con Mercado Pago" };
  }
}
