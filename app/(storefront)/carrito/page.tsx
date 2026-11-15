"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/carrito/cart-context";
import { formatearMoneda } from "@/lib/utils";

const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const paso = `w-11 h-11 md:w-8 md:h-8 rounded border border-[#e2e8f0] hover:bg-[#f1f5f9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${foco}`;

export default function CarritoPage() {
  const { items, disminuir, aumentar, eliminar, total, limpiar } = useCart();
  // Confirmación inline de 2 pasos para acciones destructivas (vaciar/eliminar)
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<string | null>(null);

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/catalogo" className={`text-sm text-[#64748b] hover:text-[#1e293b] ${foco}`}>
          ← Volver a la tienda
        </Link>
        <h1 className="text-3xl font-semibold">Carrito</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
          <Link
            href="/catalogo"
            className={`px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors ${foco}`}
          >
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header solo en desktop; en mobile cada celda lleva su etiqueta inline */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 border-b pb-4 mb-4 text-sm font-medium text-[#64748b]">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2 text-right">Precio</div>
            <div className="col-span-2 text-right">Cantidad</div>
            <div className="col-span-2 text-right">Subtotal</div>
            <div className="col-span-2 text-right">Acción</div>
          </div>
          {items.map((item) => {
            const producto = item.producto;
            const stock = Number(producto.stock ?? 0);
            const maxed = stock > 0 && item.cantidad >= stock;
            const subtotal = Number(producto.precio_minorista) * item.cantidad;
            return (
              <div
                key={producto.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center p-3 border rounded-lg"
              >
                <div className="md:col-span-4 flex items-center gap-3">
                  <Image
                    src={producto.imagen_url ?? "/placeholder.svg"}
                    alt={producto.nombre}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <div className="font-medium">{producto.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {stock > 0
                        ? maxed
                          ? `Máx. ${stock} en stock`
                          : `${stock} en stock`
                        : "Sin stock"}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 flex md:block items-center justify-between md:text-right font-medium">
                  <span className="md:hidden text-xs text-muted-foreground">Precio</span>
                  <span>{formatearMoneda(Number(producto.precio_minorista))}</span>
                </div>
                <div className="md:col-span-2 flex md:block items-center justify-between md:justify-end gap-2">
                  <span className="md:hidden text-xs text-muted-foreground">Cantidad</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => disminuir(producto.id)}
                      disabled={item.cantidad <= 1}
                      aria-label={`Quitar una unidad de ${producto.nombre}`}
                      className={paso}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-medium" aria-live="polite">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => aumentar(producto.id)}
                      disabled={maxed}
                      aria-label={`Agregar una unidad de ${producto.nombre}`}
                      title={maxed ? `Máximo ${stock} en stock` : undefined}
                      className={paso}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2 flex md:block items-center justify-between md:text-right font-medium">
                  <span className="md:hidden text-xs text-muted-foreground">Subtotal</span>
                  <span>{formatearMoneda(subtotal)}</span>
                </div>
                <div className="md:col-span-2 flex md:block items-center justify-between md:text-right">
                  <span className="md:hidden text-xs text-muted-foreground">Acción</span>
                  {confirmarEliminarId === producto.id ? (
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          eliminar(producto.id);
                          setConfirmarEliminarId(null);
                        }}
                        className={`text-sm text-destructive hover:underline ${foco}`}
                      >
                        Sí, eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmarEliminarId(null)}
                        className={`text-sm text-[#64748b] hover:underline ${foco}`}
                      >
                        Cancelar
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmarEliminarId(producto.id)}
                      aria-label={`Eliminar ${producto.nombre} del carrito`}
                      className={`text-sm text-destructive hover:underline ${foco}`}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t pt-6">
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{formatearMoneda(total)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {confirmarVaciar ? (
                <>
                  <span className="text-sm text-[#64748b]">¿Vaciar todo el carrito?</span>
                  <button
                    type="button"
                    onClick={() => {
                      limpiar();
                      setConfirmarVaciar(false);
                    }}
                    className={`px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 transition-colors ${foco}`}
                  >
                    Sí, vaciar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmarVaciar(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors ${foco}`}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmarVaciar(true)}
                  className={`px-4 py-2 text-sm font-medium text-destructive hover:text-destructive/90 transition-colors ${foco}`}
                >
                  Vaciar carrito
                </button>
              )}
              <Link
                href="/checkout"
                className={`px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors ${foco}`}
              >
                Continuar al checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
