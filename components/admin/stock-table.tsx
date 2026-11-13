"use client";

export interface StockRow {
  id: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
  activo: boolean;
}

export interface StockTableProps {
  productos: StockRow[];
  onActualizarStock: (id: string, cantidad: number) => void;
}

export function StockTable({ productos, onActualizarStock }: StockTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="pb-3">Producto</th>
            <th className="pb-3">Stock</th>
            <th className="pb-3">Mínimo</th>
            <th className="pb-3">Estado</th>
            <th className="pb-3">Ajuste</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-3">{p.nombre}</td>
              <td className="py-3">{p.stock}</td>
              <td className="py-3">{p.stockMinimo}</td>
              <td className="py-3">{p.stock <= p.stockMinimo ? "Bajo" : "OK"}</td>
              <td className="py-3">
                <button
                  onClick={() => onActualizarStock(p.id, 1)}
                  className="text-sm text-primary hover:underline"
                >
                  +1
                </button>
                {" | "}
                <button
                  onClick={() => onActualizarStock(p.id, -1)}
                  className="text-sm text-primary hover:underline"
                >
                  -1
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
