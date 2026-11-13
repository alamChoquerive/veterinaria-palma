import { createClient } from "@/core/supabase/server";

function ListaVacia({ mensaje }: { mensaje: string }) {
  return (
    <p className="text-sm text-[#64748b] text-center py-4">
      {mensaje}
    </p>
  );
}

function TurnoItem({ turno }: { turno: any }) {
  return (
    <div className="flex justify-between items-center p-2 border rounded-lg text-sm">
      <div>
        <div className="font-medium">
          {new Date(turno.fecha).toLocaleDateString("es-AR")}
        </div>
        <div className="text-[#64748b] text-xs">{turno.estado}</div>
      </div>
      <span className="text-xs font-medium">{turno.estado}</span>
    </div>
  );
}

function PedidoItem({ pedido }: { pedido: any }) {
  return (
    <div className="flex justify-between items-center p-2 border rounded-lg text-sm">
      <div>
        <div className="font-medium">Pedido #{pedido.id.slice(0, 8)}</div>
        <div className="text-[#64748b] text-xs">{pedido.metodo_entrega}</div>
      </div>
      <span className="text-xs font-medium">${pedido.total}</span>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [productos, turnos, pedidos] = await Promise.all([
    supabase.from("productos").select("id, stock, stock_minimo, nombre"),
    supabase.from("turnos").select("id, estado, fecha"),
    supabase.from("pedidos").select("id, estado, total, metodo_entrega"),
  ]);

  const listaProductos = productos.data ?? [];
  const listaTurnos = turnos.data ?? [];
  const listaPedidos = pedidos.data ?? [];

  const stockBajo = listaProductos.filter(
    (p) => (p.stock as number) <= (p.stock_minimo as number)
  ).length;
  const turnosPendientes = listaTurnos.filter(
    (t) => t.estado === "pendiente"
  ).length;
  const pedidosPendientes = listaPedidos.filter(
    (p) => p.estado === "pendiente" || p.estado === "pago_pendiente"
  ).length;
  const totalVentas = listaPedidos.reduce(
    (sum, p) => sum + Number(p.total || 0),
    0
  );

  const turnosRecientes = listaTurnos.slice(0, 5);
  const pedidosRecientes = listaPedidos.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Dashboard</h2>
        <p className="text-[#64748b]">Resumen operativo del negocio.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
            Productos con stock bajo
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{stockBajo}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
            Turnos pendientes
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{turnosPendientes}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
            Pedidos pendientes
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{pedidosPendientes}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
            Ventas totales
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">${totalVentas}</div>
        </div>
      </div>

      {/* Listas recientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <h3 className="font-semibold mb-4">Turnos recientes</h3>
          <div className="space-y-3">
            {turnosRecientes.length > 0 ? (
              <>
                {turnosRecientes.map((t) => (
                  <TurnoItem key={t.id} turno={t} />
                ))}
              </>
            ) : (
              <ListaVacia mensaje="No hay turnos" />
            )}
          </div>
        </section>

        <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <h3 className="font-semibold mb-4">Pedidos recientes</h3>
          <div className="space-y-3">
            {pedidosRecientes.length > 0 ? (
              <>
                {pedidosRecientes.map((p) => (
                  <PedidoItem key={p.id} pedido={p} />
                ))}
              </>
            ) : (
              <ListaVacia mensaje="No hay pedidos" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
