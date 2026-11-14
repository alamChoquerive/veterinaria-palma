import { createClient } from "@/core/supabase/server";
import {
  VentasPanel,
  type PedidoFila,
  type TurnoVentaFila,
} from "@/components/admin/ventas-panel";
import type { Pedido, Pago, Turno } from "@/types/database.types";

export default async function AdminVentasPage() {
  const supabase = await createClient();

  const [pedidos, perfiles, pagos, items, turnos] = await Promise.all([
    supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, apellido, email, rol"),
    supabase
      .from("pagos")
      .select("pedido_id, proveedor, estado, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("pedido_items").select("pedido_id, cantidad"),
    supabase.from("turnos").select("*").order("fecha", { ascending: false }),
  ]);

  const mapaPerfiles = new Map((perfiles.data ?? []).map((p) => [p.id, p]));
  const mapaPagos = new Map<string, Pago>();
  for (const p of pagos.data ?? []) {
    if (!mapaPagos.has(p.pedido_id)) mapaPagos.set(p.pedido_id, p as Pago);
  }
  const mapaItems = new Map<string, number>();
  for (const it of items.data ?? []) {
    mapaItems.set(it.pedido_id, (mapaItems.get(it.pedido_id) ?? 0) + Number(it.cantidad));
  }

  const filasPedidos: PedidoFila[] = (pedidos.data ?? []).map((p) => ({
    ...(p as Pedido),
    perfil: mapaPerfiles.get(p.perfil_id ?? "") ?? null,
    pago: mapaPagos.get(p.id) ?? null,
    cantidadItems: mapaItems.get(p.id) ?? 0,
  }));

  const filasTurnos: TurnoVentaFila[] = (turnos.data ?? []).map((t) => ({
    ...(t as Turno),
    perfil: t.perfil_id ? (mapaPerfiles.get(t.perfil_id) ?? null) : null,
  }));

  return <VentasPanel pedidos={filasPedidos} turnos={filasTurnos} />;
}
