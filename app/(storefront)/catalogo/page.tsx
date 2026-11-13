"use client";

import { PRODUCTOS } from "@/lib/data/productos";
import { useCart } from "@/components/carrito/cart-context";

export default function CatalogoPage() {
  const { agregar } = useCart();

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold mb-6">Catálogo de productos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTOS.map((p) => (
          <article key={p.id} className="border rounded-xl p-4 flex flex-col">
            <img
              src={p.imagen}
              alt={p.nombre}
              className="w-full h-36 object-cover rounded-lg mb-3"
            />
            <h3 className="font-semibold">{p.nombre}</h3>
            <p className="text-xs text-muted-foreground mb-1">{p.categoria}</p>
            <p className="text-sm text-muted-foreground mb-3 flex-1">
              {p.descripcion}
            </p>
            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="font-bold">$ {p.precioMinorista}</span>
              <button
                onClick={() => agregar(p)}
                disabled={p.stock === 0}
                className="px-4 py-2 bg-[#1e293b] text-white rounded text-sm font-medium hover:bg-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {p.stock === 0 ? "Sin stock" : "Agregar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
