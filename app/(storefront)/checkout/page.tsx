import { createClient } from "@/core/supabase/server";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import type { ZonaEnvio } from "@/types/database.types";

/**
 * La página lee las zonas de envío activas de la base (fuente de verdad)
 * y se las pasa al flujo de checkout (client). El costo real lo calcula
 * el servidor al crear el pedido (RPC crear_pedido).
 */
export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: zonas } = await supabase
    .from("zonas_envio")
    .select("*")
    .eq("activo", true)
    .order("costo");

  return <CheckoutFlow zonas={(zonas ?? []) as ZonaEnvio[]} />;
}
