import { createClient } from "@/core/supabase/server";
import { PedidosTable, type PedidoAdminFila } from "@/components/admin/pedidos-table";
import type { Pedido } from "@/types/database.types";

export const metadata = { title: "Pedidos · Admin — Veterinaria Palma" };

export default async function AdminPedidosPage() {
  const supabase = await createClient();

  const [pedidos, perfiles] = await Promise.all([
    supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, apellido, email, rol"),
  ]);

  const filas: PedidoAdminFila[] = (pedidos.data ?? []).map((p) => ({
    ...(p as Pedido),
    perfil: perfiles.data?.find((pe) => pe.id === p.perfil_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Pedidos</h2>
        <p className="text-muted-foreground">Seguimiento de todos los pedidos.</p>
      </div>
      <PedidosTable pedidos={filas} />
    </div>
  );
}
