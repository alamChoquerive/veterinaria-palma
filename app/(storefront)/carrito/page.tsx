"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/carrito/cart-context";
import { formatearMoneda } from "@/lib/utils";

export default function CarritoPage() {
  const { items, disminuir, aumentar, eliminar, total, limpiar } = useCart();

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/catalogo" className="text-sm text-[#64748b] hover:text-[#1e293b]">
          ← Volver a la tienda
        </Link>
        <h1 className="text-3xl font-semibold">Carrito</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
          <Link
            href="/catalogo"
            className="px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors"
          >
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b pb-4 mb-4 text-sm font-medium text-[#64748b]">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2 text-right">Precio</div>
            <div className="col-span-2 text-right">Cantidad</div>
            <div className="col-span-2 text-right">Subtotal</div>
            <div className="col-span-2 text-right">Acción</div>
          </div>
          {items.map((item) => {
            const producto = item.producto;
            const subtotal = Number(producto.precio_minorista) * item.cantidad;
            return (
              <div
                key={producto.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 border rounded-lg"
              >
                <div className="col-span-4 flex items-center gap-3">
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
                      {producto.stock > 0 ? `${producto.stock} en stock` : "Sin stock"}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right font-medium">{formatearMoneda(Number(producto.precio_minorista))}</div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => disminuir(producto.id)}
                    className="w-8 h-8 rounded border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{item.cantidad}</span>
                  <button
                    onClick={() => aumentar(producto.id)}
                    className="w-8 h-8 rounded border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="col-span-2 text-right font-medium">{formatearMoneda(subtotal)}</div>
                <div className="col-span-2 text-right">
                  <button
                    onClick={() => eliminar(producto.id)}
                    className="text-sm text-destructive hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
          <div className="mt-8 flex justify-between items-center border-t pt-6">
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{formatearMoneda(total)}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={limpiar}
                className="px-6 py-2 text-sm font-medium text-destructive hover:text-destructive/90 transition-colors"
              >
                Vaciar carrito
              </button>
              <Link
                href="/checkout"
                className="px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors"
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
