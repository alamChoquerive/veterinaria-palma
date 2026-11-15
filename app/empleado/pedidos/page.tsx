import { createClient } from "@/core/supabase/server";
import { PedidosTable, type PedidoAdminFila } from "@/components/admin/pedidos-table";
import type { Pedido } from "@/types/database.types";

export default async function EmpleadoPedidosPage() {
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
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Pedidos</h2>
        <p className="text-[#64748b]">
          Solo lectura: el estado de los pedidos lo cambia el administrador.
        </p>
      </div>
      <PedidosTable pedidos={filas} puedeCambiarEstado={false} />
    </div>
  );
}
