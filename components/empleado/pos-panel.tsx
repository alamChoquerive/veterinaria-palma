"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  crearVentaPresencial,
  actualizarEstadoVenta,
} from "@/core/actions/ventas.action";
import { formatearMoneda } from "@/lib/utils";
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

const COLOR_ESTADO_VENTA: Record<string, string> = {
  pagada: "bg-[#d1fae5] text-[#065f46]",
  pago_pendiente: "bg-[#fef3c7] text-[#92400e]",
  cancelado: "bg-[#fee2e2] text-[#991b1b]",
};

const ETIQUETA_ESTADO_VENTA: Record<string, string> = {
  pagada: "Pagada",
  pago_pendiente: "Pago pendiente",
  cancelado: "Cancelada",
};

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
  const [ventaRegistrada, setVentaRegistrada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const filtrados = productos.filter((p) => {
    if (!busqueda.trim()) return true;
    return p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  const total = ticket.reduce(
    (s, i) => s + Number(i.producto.precio_minorista) * i.cantidad,
    0,
  );

  function agregar(producto: ProductoPos) {
    setError(null);
    setTicket((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id);
      if (existe) {
        if (existe.cantidad + 1 > producto.stock) {
          setError(`Stock insuficiente de ${producto.nombre} (quedan ${producto.stock})`);
          return prev;
        }
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      if (producto.stock < 1) {
        setError(`Sin stock de ${producto.nombre}`);
        return prev;
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId: string, delta: number) {
    setTicket((prev) =>
      prev
        .map((i) => {
          if (i.producto.id !== productoId) return i;
          const nueva = i.cantidad + delta;
          if (nueva > i.producto.stock) {
            setError(`Stock insuficiente de ${i.producto.nombre} (quedan ${i.producto.stock})`);
            return i;
          }
          return { ...i, cantidad: nueva };
        })
        .filter((i) => i.cantidad > 0),
    );
  }

  function nuevaVenta() {
    setTicket([]);
    setCliente("");
    setVentaRegistrada(null);
    setError(null);
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
      setVentaRegistrada(resultado.data?.venta_id.slice(0, 8) ?? "");
      setMensaje(`Venta registrada #${resultado.data?.venta_id.slice(0, 8)} — ${formatearMoneda(Number(resultado.data?.total ?? 0))}`);
      router.refresh();
    } else {
      setError(resultado.error);
    }
  }

  async function marcarPagada(ventaId: string) {
    setMensaje(null);
    const resultado = await actualizarEstadoVenta({ ventaId, estado: "pagada" });
    if (resultado.ok) {
      setMensaje("Venta marcada como pagada");
      router.refresh();
    } else {
      setMensaje(resultado.error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Venta presencial (POS)</h2>
        <p className="text-[#64748b]">Cargá productos al ticket y confirmá la venta.</p>
      </div>

      {(mensaje || error) && (
        <div
          className={`p-3 rounded-lg text-sm border ${
            error
              ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
              : "bg-[#f0fdf4] text-[#065f46] border-[#bbf7d0]"
          }`}
        >
          {error ?? mensaje}
        </div>
      )}

      {ventaRegistrada && (
        <div className="p-4 rounded-lg bg-[#ecfeff] border border-[#a5f3fc] flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#0e7490]">
            Venta #{ventaRegistrada} registrada correctamente
          </span>
          <button
            onClick={nuevaVenta}
            className="px-4 py-2 text-sm bg-[#0e7490] text-white rounded-lg hover:bg-[#155e75] transition-colors font-medium"
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
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => agregar(p)}
                disabled={p.stock < 1}
                className="bg-white border border-[#e2e8f0] rounded-xl p-3 text-left hover:border-[#0e7490] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image
                  src={p.imagen_url ?? "/placeholder.svg"}
                  alt={p.nombre}
                  width={64}
                  height={64}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                />
                <div className="text-sm font-medium text-[#1e293b] line-clamp-2 min-h-10">
                  {p.nombre}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-bold text-[#0e7490]">
                    {formatearMoneda(Number(p.precio_minorista))}
                  </span>
                  <span
                    className={`text-xs font-bold ${p.stock <= 5 ? "text-[#991b1b]" : "text-[#64748b]"}`}
                  >
                    Stock: {p.stock}
                  </span>
                </div>
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="col-span-full text-center text-sm text-[#64748b] py-8">
                No hay productos para la búsqueda
              </p>
            )}
          </div>
        </div>

        {/* Ticket */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 h-fit lg:sticky lg:top-6">
          <h3 className="font-semibold text-[#1e293b] mb-3">Ticket</h3>
          {ticket.length === 0 ? (
            <p className="text-sm text-[#64748b] py-4 text-center">
              El ticket está vacío. Agregá productos del catálogo.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {ticket.map((i) => (
                <div key={i.producto.id} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{i.producto.nombre}</div>
                    <div className="text-xs text-[#64748b]">
                      {formatearMoneda(Number(i.producto.precio_minorista))} c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cambiarCantidad(i.producto.id, -1)}
                      className="w-6 h-6 rounded border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]"
                      aria-label={`Quitar una unidad de ${i.producto.nombre}`}
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold">{i.cantidad}</span>
                    <button
                      onClick={() => cambiarCantidad(i.producto.id, 1)}
                      className="w-6 h-6 rounded border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]"
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

          <div className="space-y-3 border-t border-[#e2e8f0] pt-4">
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">
                Cliente (opcional)
              </label>
              <input
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                placeholder="Nombre del cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Método de pago</label>
              <select
                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white"
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
              <span className="text-sm font-semibold text-[#64748b]">Total</span>
              <span className="text-xl font-bold text-[#1e293b]">{formatearMoneda(total)}</span>
            </div>
            <button
              onClick={confirmarVenta}
              disabled={enviando || ticket.length === 0}
              className="w-full px-4 py-2.5 text-sm bg-[#0e7490] text-white rounded-lg hover:bg-[#155e75] disabled:opacity-50 transition-colors font-bold"
            >
              {enviando ? "Registrando..." : "Confirmar venta"}
            </button>
          </div>
        </div>
      </div>

      {/* Ventas del día */}
      <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
        <h3 className="font-semibold text-[#1e293b] mb-4">Ventas de hoy</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-[#f8fafc]">
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">ID</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Hora</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Vendedor</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Método</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Total</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ventasHoy.length > 0 ? (
                ventasHoy.map((v) => (
                  <tr key={v.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">#{v.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(v.created_at).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">{v.cliente_nombre || "—"}</td>
                    <td className="px-4 py-3 text-sm">{v.vendedor}</td>
                    <td className="px-4 py-3 text-sm">{v.metodo_pago}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ESTADO_VENTA[v.estado] ?? "bg-[#e2e8f0] text-[#64748b]"}`}
                      >
                        {ETIQUETA_ESTADO_VENTA[v.estado] ?? v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatearMoneda(Number(v.total))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {v.estado === "pago_pendiente" ? (
                        <button
                          onClick={() => marcarPagada(v.id)}
                          className="text-xs text-[#065f46] hover:underline"
                        >
                          Marcar pagada
                        </button>
                      ) : (
                        <span className="text-xs text-[#94a3b8]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#64748b]">
                    Todavía no hay ventas hoy
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
