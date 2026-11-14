"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/carrito/cart-context";
import { DeliveryForm } from "@/components/checkout/delivery-form";
import { crearPedido } from "@/core/actions/pedido.action";
import { formatearMoneda } from "@/lib/utils";
import { ZONAS_ENVIO } from "@/lib/constants";

export default function CheckoutPage() {
  const { items, limpiar, cantidadTotal } = useCart();
  const [metodo, setMetodo] = useState<
    "retiro_tienda" | "envio_local" | "envio_provincial"
  >("retiro_tienda");
  const [direccion, setDireccion] = useState<string>("");
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidoCreado, setPedidoCreado] = useState<{
    id: string;
    total: number;
  } | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.producto.precio_minorista) * item.cantidad,
    0
  );

  useEffect(() => {
    setTotal(subtotal + costoEnvio);
  }, [subtotal, costoEnvio]);

  const zonas = ZONAS_ENVIO as unknown as {
    id: string;
    nombre: string;
    costo: number;
  }[];

  async function handleCrearPedido() {
    if (items.length === 0) {
      setError("Tu carrito está vacío");
      return;
    }

    setProcesando(true);
    setError(null);

    // Solo se envían los productos y el método de entrega: precios, envío
    // y total los calcula el servidor (RPC crear_pedido).
    const itemsPayload = items.map((item) => ({
      productoId: item.producto.id,
      cantidad: item.cantidad,
    }));

    const resultado = await crearPedido({
      metodoEntrega: metodo,
      direccionEnvio: direccion || undefined,
      items: itemsPayload,
    });

    setProcesando(false);

    if ("ok" in resultado && !resultado.ok) {
      setError(resultado.error ?? "Error al crear el pedido");
      return;
    }

    const data = resultado.data as { pedido_id: string; total: number };
    setPedidoCreado({ id: data.pedido_id, total: data.total });
    setTotal(data.total);
  }

  async function handlePagoMercadoPago() {
    if (!pedidoCreado) return;

    setProcesando(true);
    setError(null);

    const {
      crearPreferenciaPago,
    } = await import("@/core/actions/pago.action");

    const resultado = await crearPreferenciaPago({
      pedidoId: pedidoCreado.id,
    });

    setProcesando(false);

    if (
      "ok" in resultado &&
      resultado.ok &&
      resultado.data &&
      typeof resultado.data === "object" &&
      "initPoint" in resultado.data
    ) {
      window.location.href = (resultado.data as { initPoint: string }).initPoint;
    } else {
      setError(
        "ok" in resultado && !resultado.ok
          ? resultado.error
          : "Error al iniciar el pago"
      );
    }
  }

  if (cantidadTotal === 0) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Carrito vacío</h1>
        <p className="text-[#64748b] mb-6">
          Agregá productos al carrito antes de continuar con el checkout.
        </p>
        <Link
          href="/catalogo"
          className="px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] transition-colors"
        >
          Ir a la tienda
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {pedidoCreado ? (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-6 text-center mb-8">
          <h2 className="text-xl font-bold text-[#065f46] mb-2">
            Pedido creado #{pedidoCreado.id.slice(0, 8)}
          </h2>
          <p className="text-[#64748b] mb-4">
            Total: {formatearMoneda(pedidoCreado.total)}
          </p>
          <button
            onClick={handlePagoMercadoPago}
            disabled={procesando}
            className="px-6 py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
          >
            {procesando ? "Iniciando pago..." : "Pagar con Mercado Pago"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <DeliveryForm
              zonas={zonas as any}
              subtotal={subtotal}
              onChange={({ metodo: m, direccion: d, costoEnvio: c }) => {
                setMetodo(m as "retiro_tienda" | "envio_local" | "envio_provincial");
                setDireccion(d);
                setCostoEnvio(c);
              }}
            />

            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
              <h3 className="font-bold mb-4">Resumen del pedido</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.producto.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <div className="font-medium">{item.producto.nombre}</div>
                      <div className="text-[#64748b] text-xs">
                        x{item.cantidad}
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatearMoneda(
                        Number(item.producto.precio_minorista) * item.cantidad
                      )}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatearMoneda(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Envío</span>
                  <span className="font-medium">
                    {formatearMoneda(costoEnvio)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatearMoneda(total)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca]">
                {error}
              </div>
            )}

            <button
              onClick={handleCrearPedido}
              disabled={procesando || cantidadTotal === 0}
              className="w-full py-3 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
            >
              {procesando ? "Creando pedido..." : "Crear pedido y continuar"}
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 sticky top-24">
              <h3 className="font-bold mb-4">Resumen</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Productos</span>
                  <span>{formatearMoneda(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Envío</span>
                  <span>{formatearMoneda(costoEnvio)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatearMoneda(total)}</span>
                </div>
              </div>
              <p className="text-xs text-[#64748b] mt-4">
                Los datos se envían de forma segura a Mercado Pago.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/catalogo"
          className="text-[#64748b] hover:text-[#1e293b] text-sm"
        >
          ← Seguir comprando
        </Link>
      </div>
    </main>
  );
}
