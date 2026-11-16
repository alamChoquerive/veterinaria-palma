"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  crearVentaPresencial,
  actualizarEstadoVenta,
} from "@/core/actions/ventas.action";
import { formatearMoneda } from "@/lib/utils";
import { LIMITE_STOCK_BAJO } from "@/lib/constants";
import { FormFeedback } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EstadoBadge } from "@/components/ui/estado-badge";
import type { MedioPago } from "@/types/database.types";

export interface ProductoPos {
  id: string;
  nombre: string;
  precio_minorista: number;
  stock: number;
  imagen_url?: string | null;
  activo: boolean;
}

export interface VentaDelDia {
  id: string;
  cliente_nombre?: string | null;
  metodo_pago: string;
  estado: string;
  total: number;
  created_at: string;
  vendedor: string;
}

interface ItemTicket {
  producto: ProductoPos;
  cantidad: number;
}

/**
 * En la pantalla del POS (a la vista del público) el nombre del cliente se
 * enmascara: inicial del nombre + inicial del apellido ("S. C.").
 */
function enmascararNombre(nombre: string | null | undefined): string {
  if (!nombre || !nombre.trim()) return "—";
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return `${partes[0][0].toUpperCase()}. …`;
  return `${partes[0][0].toUpperCase()}. ${partes[partes.length - 1][0].toUpperCase()}.`;
}

export function PosPanel({
  productos,
  medios,
  ventasHoy,
}: {
  productos: ProductoPos[];
  medios: MedioPago[];
  ventasHoy: VentaDelDia[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [ticket, setTicket] = useState<ItemTicket[]>([]);
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState<string>(
    medios.find((m) => m.clave === "efectivo")?.clave ?? medios[0]?.clave ?? "efectivo",
  );
  const [enviando, setEnviando] = useState(false);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [ventaRegistrada, setVentaRegistrada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  // El cobro pasa por diálogo de confirmación (evita el doble tap accidental)
  const [confirmarPendiente, setConfirmarPendiente] = useState(false);
  const [pagarPendiente, setPagarPendiente] = useState<VentaDelDia | null>(null);

  const filtrados = productos.filter((p) => {
    if (!busqueda.trim()) return true;
    return p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  const total = ticket.reduce(
    (s, i) => s + Number(i.producto.precio_minorista) * i.cantidad,
    0,
  );

  const metodoPagoNombre =
    medios.find((m) => m.clave === metodoPago)?.nombre ?? metodoPago;

  // OJO: nada de setError dentro de un updater de setTicket (en StrictMode el
  // updater corre dos veces y duplicaría el efecto)
  function agregar(producto: ProductoPos) {
    setError(null);
    const existe = ticket.find((i) => i.producto.id === producto.id);
    if (existe) {
      if (existe.cantidad + 1 > producto.stock) {
        setError(`Stock insuficiente de ${producto.nombre} (quedan ${producto.stock})`);
        return;
      }
      setTicket(
        ticket.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        ),
      );
      return;
    }
    if (producto.stock < 1) {
      setError(`Sin stock de ${producto.nombre}`);
      return;
    }
    setTicket([...ticket, { producto, cantidad: 1 }]);
  }

  function cambiarCantidad(productoId: string, delta: number) {
    setError(null);
    const actual = ticket.find((i) => i.producto.id === productoId);
    if (!actual) return;
    const nueva = actual.cantidad + delta;
    if (nueva > actual.producto.stock) {
      setError(
        `Stock insuficiente de ${actual.producto.nombre} (quedan ${actual.producto.stock})`,
      );
      return;
    }
    setTicket(
      ticket
        .map((i) =>
          i.producto.id === productoId ? { ...i, cantidad: nueva } : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  }

  function nuevaVenta() {
    setTicket([]);
    setCliente("");
    setVentaRegistrada(null);
    setError(null);
    setMensaje(null);
  }

  async function confirmarVenta() {
    if (ticket.length === 0) return;
    setEnviando(true);
    setError(null);
    setMensaje(null);
    const resultado = await crearVentaPresencial({
      clienteNombre: cliente || undefined,
      metodoPago: (metodoPago === "mercadopago" ? "mercadopago" : "efectivo"),
      items: ticket.map((i) => ({
        productoId: i.producto.id,
        cantidad: i.cantidad,
      })),
    });
    setEnviando(false);
    if (resultado.ok) {
      const idCorto = resultado.data?.venta_id.slice(0, 8) ?? "";
      setVentaRegistrada(idCorto);
      setMensaje(
        `Venta registrada #${idCorto} — ${formatearMoneda(Number(resultado.data?.total ?? 0))}`,
      );
      // Limpiar el ticket apenas se confirma: el botón queda deshabilitado y
      // no hay ventana de doble cobro (antes el ticket seguía cargado y activo)
      setTicket([]);
      setCliente("");
      router.refresh();
    } else {
      setError(resultado.error);
    }
  }

  async function marcarPagada(ventaId: string) {
    setMarcando(ventaId);
    setMensaje(null);
    setError(null);
    const resultado = await actualizarEstadoVenta({ ventaId, estado: "pagada" });
    setMarcando(null);
    if (resultado.ok) {
      setMensaje("Venta marcada como pagada");
      router.refresh();
    } else {
      // El error NUNCA va al banner de éxito (antes setMensaje(resultado.error)
      // lo pintaba verde)
      setError(resultado.error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Venta presencial (POS)</h2>
        <p className="text-muted-foreground">Cargá productos al ticket y confirmá la venta.</p>
      </div>

      {error && <FormFeedback tipo="error">{error}</FormFeedback>}
      {mensaje && <FormFeedback tipo="exito">{mensaje}</FormFeedback>}

      {ventaRegistrada && (
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-bold text-primary">
            Venta #{ventaRegistrada} registrada correctamente
          </span>
          <button
            onClick={nuevaVenta}
            className="px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Cargar nueva venta
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo */}
        <div className="lg:col-span-2 space-y-4">
          <input
            type="search"
            placeholder="Buscar producto..."
            aria-label="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => agregar(p)}
                disabled={p.stock < 1}
                className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-11"
              >
                <Image
                  src={p.imagen_url ?? "/placeholder.svg"}
                  alt={p.nombre}
                  width={64}
                  height={64}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                />
                <div className="text-sm font-medium text-primary line-clamp-2 min-h-10">
                  {p.nombre}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-bold text-primary">
                    {formatearMoneda(Number(p.precio_minorista))}
                  </span>
                  <span
                    className={`text-xs font-bold ${p.stock <= LIMITE_STOCK_BAJO ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Stock: {p.stock}
                  </span>
                </div>
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                No hay productos para la búsqueda
              </p>
            )}
          </div>
        </div>

        {/* Ticket */}
        <div className="bg-card border border-border rounded-xl p-5 h-fit lg:sticky lg:top-6">
          <h3 className="font-semibold text-primary mb-3">Ticket</h3>
          {ticket.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              El ticket está vacío. Agregá productos del catálogo.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {ticket.map((i) => (
                <div key={i.producto.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{i.producto.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatearMoneda(Number(i.producto.precio_minorista))} c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cambiarCantidad(i.producto.id, -1)}
                      className="inline-flex items-center justify-center min-w-11 min-h-11 rounded border border-border text-muted-foreground hover:bg-muted"
                      aria-label={`Quitar una unidad de ${i.producto.nombre}`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold">{i.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(i.producto.id, 1)}
                      className="inline-flex items-center justify-center min-w-11 min-h-11 rounded border border-border text-muted-foreground hover:bg-muted"
                      aria-label={`Agregar una unidad de ${i.producto.nombre}`}
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right font-medium">
                    {formatearMoneda(Number(i.producto.precio_minorista) * i.cantidad)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Cliente (opcional)
              </label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background"
                placeholder="Nombre del cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Método de pago</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                {medios.map((m) => (
                  <option key={m.clave} value={m.clave}>{m.nombre}</option>
                ))}
                {medios.length === 0 && <option value="efectivo">Efectivo</option>}
              </select>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-semibold text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">{formatearMoneda(total)}</span>
            </div>
            <button
              onClick={() => setConfirmarPendiente(true)}
              disabled={enviando || ticket.length === 0}
              className="w-full px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
            >
              {enviando ? "Registrando..." : "Confirmar venta"}
            </button>
          </div>
        </div>
      </div>

      {/* Ventas del día */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-primary mb-4">Ventas de hoy</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Hora</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Vendedor</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Método</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Total</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ventasHoy.length > 0 ? (
                ventasHoy.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">#{v.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(v.created_at).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">{enmascararNombre(v.cliente_nombre)}</td>
                    <td className="px-4 py-3 text-sm">{v.vendedor}</td>
                    <td className="px-4 py-3 text-sm">
                      {medios.find((m) => m.clave === v.metodo_pago)?.nombre ?? v.metodo_pago}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={v.estado} tipo="venta" />
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatearMoneda(Number(v.total))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.estado === "pago_pendiente" ? (
                        <button
                          onClick={() => setPagarPendiente(v)}
                          disabled={marcando !== null}
                          className="inline-flex items-center justify-center min-h-11 px-2 text-xs text-emerald-700 hover:underline disabled:opacity-50"
                        >
                          {marcando === v.id ? "Marcando..." : "Marcar pagada"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Todavía no hay ventas hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmar venta: diálogo con total, método y cliente antes de cobrar */}
      {confirmarPendiente && (
        <ConfirmDialog
          titulo="Confirmar venta"
          descripcion={
            <>
              <span className="font-bold">{ticket.length}</span> producto
              {ticket.length === 1 ? "" : "s"} por{" "}
              <span className="font-bold">{formatearMoneda(total)}</span> —{" "}
              {metodoPagoNombre}
              {cliente.trim() ? (
                <>
                  {" "}· cliente <span className="font-medium">{cliente.trim()}</span>
                </>
              ) : null}
              . El stock se descuenta al registrar.
            </>
          }
          etiquetaConfirmar="Confirmar venta"
          cargando={enviando}
          onConfirmar={() => {
            setConfirmarPendiente(false);
            void confirmarVenta();
          }}
          onCerrar={() => setConfirmarPendiente(false)}
        />
      )}

      {/* Marcar pagada también pasa por confirmación (cambio de estado de dinero) */}
      {pagarPendiente && (
        <ConfirmDialog
          titulo="Marcar venta como pagada"
          descripcion={
            <>
              Venta <span className="font-mono">#{pagarPendiente.id.slice(0, 8)}</span> de{" "}
              <span className="font-medium">
                {medios.find((m) => m.clave === pagarPendiente.metodo_pago)?.nombre ?? pagarPendiente.metodo_pago}
              </span>{" "}
              por <span className="font-medium">{formatearMoneda(Number(pagarPendiente.total))}</span>.
            </>
          }
          etiquetaConfirmar="Marcar pagada"
          cargando={marcando !== null}
          onConfirmar={() => {
            const v = pagarPendiente;
            setPagarPendiente(null);
            void marcarPagada(v.id);
          }}
          onCerrar={() => setPagarPendiente(null)}
        />
      )}
    </div>
  );
}
