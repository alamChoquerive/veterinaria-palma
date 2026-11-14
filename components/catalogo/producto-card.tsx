"use client";

import { useState } from "react";
import type { Producto } from "@/types/database.types";
import { useCart } from "@/components/carrito/cart-context";
import { formatearMoneda } from "@/lib/utils";

interface ProductoCardProps {
  producto: Producto;
  categoria?: string | null;
}

export function ProductoCard({ producto, categoria }: ProductoCardProps) {
  const { agregar } = useCart();
  const [agregado, setAgregado] = useState(false);

  const sinStock = producto.stock <= 0;

  function handleAgregar() {
    agregar(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <article className="border rounded-xl p-4 flex flex-col">
      <img
        src={producto.imagen_url ?? "/placeholder.svg"}
        alt={producto.nombre}
        className="w-full h-36 object-cover rounded-lg mb-3"
      />
      <h3 className="font-semibold">{producto.nombre}</h3>
      <p className="text-xs text-muted-foreground mb-1">
        {categoria ?? "Sin categoría"}
      </p>
      <p className="text-sm text-muted-foreground mb-3 flex-1">
        {producto.descripcion ?? ""}
      </p>
      <div className="flex items-center justify-between mt-auto pt-3">
        <span className="font-bold">
          {formatearMoneda(Number(producto.precio_minorista))}
        </span>
        <button
          onClick={handleAgregar}
          disabled={sinStock}
          className="px-4 py-2 bg-[#1e293b] text-white rounded text-sm font-medium hover:bg-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sinStock ? "Sin stock" : agregado ? "Agregado ✓" : "Agregar"}
        </button>
      </div>
    </article>
  );
}
