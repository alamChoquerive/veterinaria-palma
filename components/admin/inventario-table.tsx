"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarStock } from "@/core/actions/stock.action";
import { formatearMoneda } from "@/lib/utils";
import type { Producto } from "@/types/database.types";

export interface ProductoFila extends Producto {
  categoria?: string | null;
}

export function InventarioTable({ productos }: { productos: ProductoFila[] }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function ajustarStock(id: string, cantidad: number) {
    setCargando(true);
    setMensaje(null);
    const resultado = await actualizarStock({ productoId: id, cantidad });
    setCargando(false);
    if (resultado.ok) {
      setMensaje("Stock actualizado correctamente");
      // La page (server) se vuelve a leer con el stock actualizado
      router.refresh();
    } else {
      setMensaje(resultado.error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Inventario</h2>
        <p className="text-[#64748b]">Gestión de stock de mercaderías.</p>
      </div>

      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Producto</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Categoría</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Precio Minorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Precio Mayorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Stock</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Mínimo</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Ajuste</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const bajo = p.stock <= p.stock_minimo;
              return (
                <tr key={p.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-xs text-[#64748b]">{p.categoria ?? "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748b]">
                    {p.categoria ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatearMoneda(Number(p.precio_minorista))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#64748b]">
                    {formatearMoneda(Number(p.precio_mayorista))}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      bajo ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#d1fae5] text-[#065f46]"
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-[#64748b]">
                    {p.stock_minimo}
                  </td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <button
                      onClick={() => ajustarStock(p.id, 1)}
                      disabled={cargando}
                      className="px-2.5 py-1.5 text-xs bg-[#1e293b] text-white rounded hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                      aria-label={`Aumentar stock de ${p.nombre}`}
                    >
                      +1
                    </button>
                    <button
                      onClick={() => ajustarStock(p.id, -1)}
                      disabled={cargando}
                      className="px-2.5 py-1.5 text-xs bg-[#1e293b] text-white rounded hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                      aria-label={`Disminuir stock de ${p.nombre}`}
                    >
                      -1
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cargando && <p className="text-sm text-[#64748b]">Cargando...</p>}
    </div>
  );
}
