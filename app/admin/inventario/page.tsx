import { createClient } from "@/core/supabase/server";
import {
  InventarioTable,
  type ProductoFila,
} from "@/components/admin/inventario-table";
import type { Producto } from "@/types/database.types";

export default async function AdminInventarioPage() {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("nombre");

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre");

  const filas: ProductoFila[] = (productos ?? []).map((p) => ({
    ...(p as Producto),
    categoria:
      categorias?.find((c) => c.id === p.categoria_id)?.nombre ?? null,
  }));

  const stockTotal = filas.reduce((sum, p) => sum + Number(p.stock), 0);
  const stockBajo = filas.filter(
    (p) => Number(p.stock) <= Number(p.stock_minimo),
  ).length;
  const stockOptimo = filas.length - stockBajo;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Inventario</h2>
        <p className="text-[#64748b]">Gestión de stock de mercaderías.</p>
      </div>

      {/* Resumen en 3 cuadros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
            Stock total
          </div>
          <div className="text-2xl font-bold text-[#1e293b]">{stockTotal}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
            Productos con stock bajo
          </div>
          <div className="text-2xl font-bold text-[#991b1b]">{stockBajo}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">
            Productos con stock óptimo
          </div>
          <div className="text-2xl font-bold text-[#065f46]">{stockOptimo}</div>
        </div>
      </div>

      <InventarioTable productos={filas} />
    </div>
  );
}
