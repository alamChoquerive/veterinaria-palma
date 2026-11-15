"use client";

import { useState } from "react";
import Image from "next/image";
import type { Producto } from "@/types/database.types";
import { useCart } from "@/components/carrito/cart-context";
import { formatearMoneda } from "@/lib/utils";

interface ProductoCardProps {
  producto: Producto;
  categoria?: string | null;
}

export function ProductoCard({ producto, categoria }: ProductoCardProps) {
  const { agregar, items } = useCart();
  const [agregado, setAgregado] = useState(false);

  const sinStock = producto.stock <= 0;
  const enCarrito = items.find((i) => i.producto.id === producto.id)?.cantidad ?? 0;
  const maxed = !sinStock && enCarrito >= producto.stock;

  function handleAgregar() {
    agregar(producto);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <article className="border rounded-xl p-4 flex flex-col">
      <Image
        src={producto.imagen_url ?? "/placeholder.svg"}
        alt={producto.nombre}
        width={400}
        height={144}
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
          type="button"
          onClick={handleAgregar}
          disabled={sinStock || maxed}
          title={maxed ? `Máximo ${producto.stock} en stock` : undefined}
          className="px-4 py-2 bg-[#1e293b] text-white rounded text-sm font-medium hover:bg-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {sinStock
            ? "Sin stock"
            : maxed
              ? "Máx. en carrito"
              : agregado
                ? "Agregado ✓"
                : "Agregar"}
        </button>
      </div>
    </article>
  );
}
