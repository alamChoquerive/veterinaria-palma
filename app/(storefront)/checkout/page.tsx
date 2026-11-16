import { redirect } from "next/navigation";
import { createClient } from "@/core/supabase/server";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import type { MetodoEntrega, Producto, ZonaEnvio } from "@/types/database.types";

/**
 * La página lee las zonas de envío activas de la base (fuente de verdad)
 * y se las pasa al flujo de checkout (client). El costo real lo calcula
 * el servidor al crear el pedido (RPC crear_pedido).
 *
 * Gate de sesión REAL (no solo cookie del proxy): sin usuario se manda a
 * /login?redirect=/checkout para no llenar el formulario y recién fallar al
 * crear el pedido. Además busca el último pedido en pago_pendiente del usuario
 * para ofrecer "retomar pago" en vez de crear uno duplicado.
 */
export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/checkout");
  }

  const { data: zonas } = await supabase
    .from("zonas_envio")
    .select("*")
    .eq("activo", true)
    .order("costo");

  const { data: pendiente } = await supabase
    .from("pedidos")
    .select("id,total,costo_envio,metodo_entrega,direccion_envio,estado,created_at")
    .eq("perfil_id", user.id)
    .eq("estado", "pago_pendiente")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let pedidoPendiente: {
    id: string;
    total: number;
    costo_envio: number;
    metodo_entrega: MetodoEntrega;
    direccion_envio: string | null;
    items: { nombre: string; cantidad: number; subtotal: number }[];
  } | null = null;

  if (pendiente) {
    const { data: pedidoItems } = await supabase
      .from("pedido_items")
      .select("cantidad,subtotal,producto_id")
      .eq("pedido_id", pendiente.id);

    const ids = [...new Set((pedidoItems ?? []).map((i) => i.producto_id))];
    let productos: Pick<Producto, "id" | "nombre">[] = [];
    if (ids.length > 0) {
      const { data: prods } = await supabase
        .from("productos")
        .select("id,nombre")
        .in("id", ids);
      productos = (prods ?? []) as Pick<Producto, "id" | "nombre">[];
    }
    const nombrePorId = new Map(productos.map((p) => [p.id, p.nombre]));

    pedidoPendiente = {
      id: pendiente.id,
      total: Number(pendiente.total),
      costo_envio: Number(pendiente.costo_envio),
      metodo_entrega: pendiente.metodo_entrega as MetodoEntrega,
      direccion_envio: pendiente.direccion_envio ?? null,
      items: (pedidoItems ?? []).map((i) => ({
        nombre: nombrePorId.get(i.producto_id) ?? "Producto",
        cantidad: i.cantidad,
        subtotal: Number(i.subtotal),
      })),
    };
  }

  return (
    <CheckoutFlow
      zonas={(zonas ?? []) as ZonaEnvio[]}
      pedidoPendiente={pedidoPendiente}
    />
  );
}
