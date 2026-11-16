import { createClient } from "@/core/supabase/server";
import { formatearMoneda } from "@/lib/utils";
import { ETIQUETA_ENVIO } from "@/lib/constants";
import { EstadoBadge } from "@/components/ui/estado-badge";
import type { Pedido, Turno } from "@/types/database.types";

// Estados que cuentan como venta concretada (pagada y no cancelada)
const ESTADOS_VENTA = [
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "retiro_pendiente",
];

function ListaVacia({ mensaje }: { mensaje: string }) {
  return (
    <p className="text-sm text-[#64748b] text-center py-4">{mensaje}</p>
  );
}

function TurnoItem({ turno }: { turno: Pick<Turno, "fecha" | "estado"> }) {
  return (
    <div className="flex justify-between items-center p-2 border rounded-lg text-sm">
      <div className="font-medium">
        {new Date(turno.fecha).toLocaleDateString("es-AR")}
      </div>
      <EstadoBadge estado={turno.estado} tipo="turno" />
    </div>
  );
}

function PedidoItem({
  pedido,
}: {
  pedido: Pick<Pedido, "id" | "metodo_entrega" | "total">;
}) {
  return (
    <div className="flex justify-between items-center p-2 border rounded-lg text-sm">
      <div>
        <div className="font-medium">Pedido #{pedido.id.slice(0, 8)}</div>
        <div className="text-[#64748b] text-xs">
          {ETIQUETA_ENVIO[pedido.metodo_entrega] ?? pedido.metodo_entrega}
        </div>
      </div>
      <span className="text-xs font-medium">{formatearMoneda(Number(pedido.total))}</span>
    </div>
  );
}

/**
 * Dashboard compartido: lo renderizan /admin/dashboard y /empleado/dashboard.
 * Con la migración 0011 el staff (empleado) también puede leer turnos,
 * pedidos y productos por RLS, así que las mismas queries sirven.
 */
export async function DashboardContent() {
  const supabase = await createClient();

  const [productos, turnos, pedidos, ventas] = await Promise.all([
    supabase.from("productos").select("id, nombre, stock, stock_minimo"),
    supabase.from("turnos").select("id, estado, fecha"),
    supabase
      .from("pedidos")
      .select("id, estado, total, metodo_entrega, created_at"),
    supabase
      .from("ventas")
      .select("id, total, created_at, estado"),
  ]);

  const listaProductos = productos.data ?? [];
  const listaTurnos = turnos.data ?? [];
  const listaPedidos = pedidos.data ?? [];
  const listaVentas = ventas.data ?? [];

  // Alertas de stock: productos con stock <= stock mínimo (crítico)
  const alertasStock = listaProductos
    .filter((p) => Number(p.stock) <= Number(p.stock_minimo))
    .sort((a, b) => Number(a.stock) - Number(b.stock));
  const stockBajo = alertasStock.length;

  const turnosPendientes = listaTurnos.filter(
    (t) => t.estado === "pendiente",
  ).length;
  const pedidosPendientes = listaPedidos.filter(
    (p) => p.estado === "pendiente" || p.estado === "pago_pendiente",
  ).length;

  // Ventas del mes actual (pedidos online concretados + ventas POS pagadas)
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const ventasPedidosMes = listaPedidos
    .filter(
      (p) =>
        ESTADOS_VENTA.includes(p.estado) &&
        new Date(p.created_at) >= inicioMes,
    )
    .reduce((sum, p) => sum + Number(p.total || 0), 0);
  const ventasPosMes = listaVentas
    .filter(
      (v) => v.estado === "pagada" && new Date(v.created_at) >= inicioMes,
    )
    .reduce((sum, v) => sum + Number(v.total || 0), 0);
  const ventasMes = ventasPedidosMes + ventasPosMes;

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
            Ventas del mes
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">
            {formatearMoneda(ventasMes)}
          </div>
        </div>
      </div>

      {/* Alertas de stock */}
      <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
        <h3 className="font-semibold mb-4 text-[#991b1b]">Alertas de stock</h3>
        {alertasStock.length > 0 ? (
          <ul className="space-y-2">
            {alertasStock.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center p-2 border border-[#fee2e2] bg-[#fef2f2] rounded-lg text-sm"
              >
                <span className="font-medium">{p.nombre}</span>
                <span className="text-xs font-bold text-[#991b1b]">
                  Stock: {p.stock} (mínimo: {p.stock_minimo})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <ListaVacia mensaje="Sin alertas de stock. Todos los productos tienen stock óptimo." />
        )}
      </section>

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
