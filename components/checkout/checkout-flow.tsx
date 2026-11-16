"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/carrito/cart-context";
import { DeliveryForm } from "@/components/checkout/delivery-form";
import { cancelarPedidoPropio, crearPedido } from "@/core/actions/pedido.action";
import { requiereDireccionEnvio } from "@/core/services/envios.service";
import { formatearMoneda } from "@/lib/utils";
import type { MetodoEntrega, ZonaEnvio } from "@/types/database.types";

export type PedidoPendiente = {
  id: string;
  total: number;
  costo_envio: number;
  metodo_entrega: MetodoEntrega;
  direccion_envio: string | null;
  items: { nombre: string; cantidad: number; subtotal?: number }[];
};

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const cta = `bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors ${foco}`;
const secundario = `border border-input bg-background text-foreground hover:bg-accent transition-colors ${foco}`;

const METODO_LABEL: Record<MetodoEntrega, string> = {
  retiro_tienda: "Retiro en tienda",
  envio_local: "Envío local (ciudad)",
  envio_provincial: "Envío provincial",
};

export function CheckoutFlow({
  zonas,
  pedidoPendiente,
}: {
  zonas: ZonaEnvio[];
  pedidoPendiente?: PedidoPendiente | null;
}) {
  const { items, cantidadTotal } = useCart();
  const [metodo, setMetodo] = useState<MetodoEntrega>("retiro_tienda");
  const [direccion, setDireccion] = useState<string>("");
  const [costoEnvio, setCostoEnvio] = useState<number>(0);
  const [procesando, setProcesando] = useState(false);
  const [yendoMP, setYendoMP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  // Si volvimos de MP con un pedido pendiente, arrancamos en "retomar pago"
  // en vez de crear uno duplicado.
  const [pedidoCreado, setPedidoCreado] = useState<PedidoPendiente | null>(
    pedidoPendiente ?? null,
  );

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  // Estimación en pantalla con precio minorista; el total real lo devuelve el servidor
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.producto.precio_minorista) * item.cantidad,
    0,
  );
  const envioOK =
    metodo === "retiro_tienda" ||
    zonas.some((z) => z.activo && z.metodo_entrega === metodo);
  // Antes de crear el pedido es la estimación; después, el total real del servidor
  const total = pedidoCreado ? pedidoCreado.total : subtotal + costoEnvio;

  async function handleCrearPedido() {
    if (items.length === 0) {
      setError("Tu carrito está vacío");
      return;
    }
    if (requiereDireccionEnvio(metodo) && !direccion.trim()) {
      setError("Ingresá la dirección de envío para este método de entrega.");
      return;
    }
    if (metodo !== "retiro_tienda" && !envioOK) {
      setError("Este método de envío no está disponible ahora. Elegí retiro en tienda.");
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

    const data = resultado.data as {
      pedido_id: string;
      total: number;
      costo_envio: number;
    };
    setPedidoCreado({
      id: data.pedido_id,
      total: Number(data.total),
      costo_envio: Number(data.costo_envio),
      metodo_entrega: metodo,
      direccion_envio: direccion.trim() ? direccion.trim() : null,
      items: items.map((item) => ({
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
      })),
    });
  }

  async function handlePagoMercadoPago() {
    if (!pedidoCreado) return;

    setProcesando(true);
    setError(null);

    const { crearPreferenciaPago } = await import("@/core/actions/pago.action");
    const resultado = await crearPreferenciaPago({ pedidoId: pedidoCreado.id });

    if (
      "ok" in resultado &&
      resultado.ok &&
      resultado.data &&
      typeof resultado.data === "object" &&
      "initPoint" in resultado.data
    ) {
      setYendoMP(true);
      window.location.href = (resultado.data as { initPoint: string }).initPoint;
      return;
    }

    setProcesando(false);
    setError(
      "ok" in resultado && !resultado.ok
        ? resultado.error
        : "Error al iniciar el pago",
    );
  }

  async function handleModificarPedido() {
    if (!pedidoCreado) return;
    setProcesando(true);
    setError(null);
    const resultado = await cancelarPedidoPropio({ pedidoId: pedidoCreado.id });
    setProcesando(false);
    if ("ok" in resultado && resultado.ok) {
      // El carrito no se tocó: volvemos al formulario para editar y crear otro
      setPedidoCreado(null);
    } else {
      setError(
        "ok" in resultado && !resultado.ok
          ? resultado.error
          : "No se pudo modificar el pedido",
      );
    }
  }

  if (cantidadTotal === 0 && !pedidoCreado) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Carrito vacío</h1>
        <p className="text-muted-foreground mb-6">
          Agregá productos al carrito antes de continuar con el checkout.
        </p>
        <Link href="/catalogo" className={`px-6 py-3 rounded-lg font-medium ${cta}`}>
          Ir a la tienda
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Finalizar compra</h1>

      {error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="p-3 rounded bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca] mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {error}
        </div>
      )}

      {pedidoCreado ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#065f46] mb-2">
                Pedido creado #{pedidoCreado.id.slice(0, 8)}
              </h2>
              <p className="text-muted-foreground mb-4">
                Total a pagar:{" "}
                <span className="font-bold text-foreground">
                  {formatearMoneda(pedidoCreado.total)}
                </span>
              </p>
              {yendoMP && (
                <p className="text-sm text-[#065f46] mb-3" aria-live="polite">
                  Te llevamos a Mercado Pago para completar el pago…
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handlePagoMercadoPago}
                  disabled={procesando}
                  className={`px-6 py-3 rounded-lg font-medium ${cta}`}
                >
                  {procesando ? "Iniciando pago..." : "Pagar con Mercado Pago"}
                </button>
                <button
                  type="button"
                  onClick={handleModificarPedido}
                  disabled={procesando}
                  className={`px-6 py-3 rounded-lg font-medium ${secundario}`}
                >
                  Modificar pedido
                </button>
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Resumen del pedido</h3>
              <ul className="space-y-2 text-sm mb-4">
                {pedidoCreado.items.slice(0, 6).map((item, idx) => (
                  <li key={`${item.nombre}-${idx}`} className="flex justify-between gap-4">
                    <span className="font-medium">{item.nombre}</span>
                    <span className="text-muted-foreground">
                      x{item.cantidad}
                      {typeof item.subtotal === "number"
                        ? ` · ${formatearMoneda(item.subtotal)}`
                        : ""}
                    </span>
                  </li>
                ))}
                {pedidoCreado.items.length > 6 && (
                  <li className="text-muted-foreground text-xs">
                    +{pedidoCreado.items.length - 6} productos más
                  </li>
                )}
              </ul>
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método de entrega</span>
                  <span className="font-medium">{METODO_LABEL[pedidoCreado.metodo_entrega]}</span>
                </div>
                {pedidoCreado.direccion_envio && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Dirección</span>
                    <span className="font-medium text-right">{pedidoCreado.direccion_envio}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium">{formatearMoneda(pedidoCreado.costo_envio)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total a pagar</span>
                  <span>{formatearMoneda(pedidoCreado.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-muted border border-border rounded-xl p-6 sticky top-24">
              <h3 className="font-bold mb-4">Resumen</h3>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total a pagar</span>
                <span>{formatearMoneda(pedidoCreado.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Los datos se envían de forma segura a Mercado Pago.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <DeliveryForm
              zonas={zonas}
              subtotal={subtotal}
              metodo={metodo}
              direccion={direccion}
              onChange={({ metodo: m, direccion: d, costoEnvio: c }) => {
                setMetodo(m);
                setDireccion(d);
                setCostoEnvio(c);
              }}
            />

            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Resumen del pedido</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.producto.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <div className="font-medium">{item.producto.nombre}</div>
                      <div className="text-muted-foreground text-xs">x{item.cantidad}</div>
                    </div>
                    <span className="font-medium">
                      {formatearMoneda(
                        Number(item.producto.precio_minorista) * item.cantidad,
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
                    {metodo !== "retiro_tienda" && !envioOK
                      ? "Sin envío configurado"
                      : formatearMoneda(costoEnvio)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>Total estimado</span>
                  <span>{formatearMoneda(total)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCrearPedido}
              disabled={procesando || cantidadTotal === 0}
              className={`w-full py-3 rounded-lg font-medium ${cta}`}
            >
              {procesando ? "Creando pedido..." : "Crear pedido y continuar"}
            </button>
          </div>

          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-muted border border-border rounded-xl p-6 sticky top-24">
              <h3 className="font-bold mb-4">Resumen</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Productos</span>
                  <span>{formatearMoneda(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {metodo !== "retiro_tienda" && !envioOK
                      ? "Sin envío configurado"
                      : formatearMoneda(costoEnvio)}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total estimado</span>
                  <span>{formatearMoneda(total)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                El total final lo confirma el servidor al crear el pedido. Los datos se
                envían de forma segura a Mercado Pago.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/catalogo"
          className={`text-muted-foreground hover:text-primary text-sm ${foco}`}
        >
          ← Seguir comprando
        </Link>
      </div>
    </main>
  );
}
