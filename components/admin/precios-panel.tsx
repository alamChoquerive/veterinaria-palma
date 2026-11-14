"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  aplicarMargenGlobal,
  actualizarPreciosProducto,
} from "@/core/actions/precios.action";
import { formatearMoneda } from "@/lib/utils";
import type { Producto } from "@/types/database.types";

export type ProductoPrecioFila = Producto;

interface FormPrecio {
  precioCosto: string;
  precioMinorista: string;
  precioMayorista: string;
}

function margenPorcentaje(costo: number | null | undefined, precio: number): number | null {
  if (!costo || costo <= 0) return null;
  return ((precio - costo) / costo) * 100;
}

function MargenBadge({ margen }: { margen: number | null }) {
  if (margen === null) return <span className="text-[#94a3b8]">—</span>;
  const color =
    margen < 0 ? "text-[#991b1b]" : margen < 10 ? "text-[#92400e]" : "text-[#065f46]";
  return <span className={`font-bold ${color}`}>{margen.toFixed(1)}%</span>;
}

export function PreciosPanel({
  productos,
  margenMinoristaInicial,
  margenMayoristaInicial,
}: {
  productos: ProductoPrecioFila[];
  margenMinoristaInicial: number;
  margenMayoristaInicial: number;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [margenMinorista, setMargenMinorista] = useState(String(margenMinoristaInicial));
  const [margenMayorista, setMargenMayorista] = useState(String(margenMayoristaInicial));
  const [aplicando, setAplicando] = useState<"minorista" | "mayorista" | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editando, setEditando] = useState<ProductoPrecioFila | null>(null);
  const [form, setForm] = useState<FormPrecio | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function aplicar(tipo: "minorista" | "mayorista") {
    const porcentaje = Number(tipo === "minorista" ? margenMinorista : margenMayorista);
    if (isNaN(porcentaje) || porcentaje < 0) {
      setMensaje("Ingresá un margen válido (0 o más)");
      return;
    }
    setAplicando(tipo);
    setMensaje(null);
    const resultado = await aplicarMargenGlobal({ tipo, porcentaje });
    setAplicando(null);
    if (resultado.ok) {
      setMensaje(
        `Margen del ${porcentaje}% aplicado a ${resultado.data?.actualizados ?? 0} productos con costo cargado`,
      );
      router.refresh();
    } else {
      setMensaje(resultado.error);
    }
  }

  function abrirEdicion(p: ProductoPrecioFila) {
    setEditando(p);
    setForm({
      precioCosto: p.precio_costo != null ? String(p.precio_costo) : "",
      precioMinorista: String(p.precio_minorista),
      precioMayorista: String(p.precio_mayorista),
    });
    setMensaje(null);
  }

  function cerrarEdicion() {
    setEditando(null);
    setForm(null);
  }

  async function guardarEdicion(e: React.FormEvent) {
    e.preventDefault();
    if (!editando || !form) return;
    setGuardando(true);
    setMensaje(null);
    const resultado = await actualizarPreciosProducto({
      productoId: editando.id,
      precioCosto: form.precioCosto === "" ? null : Number(form.precioCosto),
      precioMinorista: Number(form.precioMinorista),
      precioMayorista: Number(form.precioMayorista),
    });
    setGuardando(false);
    if (resultado.ok) {
      setMensaje("Precios actualizados");
      cerrarEdicion();
      router.refresh();
    } else {
      setMensaje(resultado.error);
    }
  }

  const filtrados = productos.filter((p) => {
    if (!busqueda.trim()) return true;
    return p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}

      {/* Márgenes globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <h3 className="font-semibold text-[#1e293b] mb-1">Margen minorista global</h3>
          <p className="text-xs text-[#64748b] mb-3">
            Se aplica sobre el precio de costo de todos los productos.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                max={500}
                step="1"
                value={margenMinorista}
                onChange={(e) => setMargenMinorista(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">%</span>
            </div>
            <button
              onClick={() => aplicar("minorista")}
              disabled={aplicando !== null}
              className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
            >
              {aplicando === "minorista" ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <h3 className="font-semibold text-[#1e293b] mb-1">Margen mayorista global</h3>
          <p className="text-xs text-[#64748b] mb-3">
            Se aplica sobre el precio de costo de todos los productos.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min={0}
                max={500}
                step="1"
                value={margenMayorista}
                onChange={(e) => setMargenMayorista(e.target.value)}
                className="w-full border border-[#e2e8f0] rounded-lg pl-3 pr-8 py-2 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#64748b]">%</span>
            </div>
            <button
              onClick={() => aplicar("mayorista")}
              disabled={aplicando !== null}
              className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
            >
              {aplicando === "mayorista" ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="search"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full md:w-80 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white"
      />

      {/* Tabla de precios */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Producto</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Costo</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Precio minorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Margen min.</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Precio mayorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Margen may.</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Editar</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => {
                const costo = p.precio_costo != null ? Number(p.precio_costo) : null;
                return (
                  <tr key={p.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {costo !== null ? formatearMoneda(costo) : <span className="text-[#94a3b8]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatearMoneda(Number(p.precio_minorista))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <MargenBadge margen={margenPorcentaje(costo, Number(p.precio_minorista))} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[#64748b]">
                      {formatearMoneda(Number(p.precio_mayorista))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <MargenBadge margen={margenPorcentaje(costo, Number(p.precio_mayorista))} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => abrirEdicion(p)}
                        className="px-2.5 py-1.5 text-xs border border-[#e2e8f0] text-[#64748b] rounded hover:bg-[#f1f5f9] transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  No hay productos para la búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal edición de precios */}
      {editando && form && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#1e293b] mb-1">Editar precios</h3>
            <p className="text-sm text-[#64748b] mb-4">{editando.nombre}</p>
            <form onSubmit={guardarEdicion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Costo</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                  value={form.precioCosto}
                  onChange={(e) => setForm({ ...form, precioCosto: e.target.value })}
                  placeholder="Sin costo cargado"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Precio minorista</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    value={form.precioMinorista}
                    onChange={(e) => setForm({ ...form, precioMinorista: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Precio mayorista</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    value={form.precioMayorista}
                    onChange={(e) => setForm({ ...form, precioMayorista: e.target.value })}
                    required
                  />
                </div>
              </div>
              {form.precioCosto !== "" && !isNaN(Number(form.precioCosto)) && Number(form.precioCosto) > 0 && (
                <p className="text-xs text-[#64748b]">
                  Márgenes actuales: minorista{" "}
                  <MargenBadge margen={margenPorcentaje(Number(form.precioCosto), Number(form.precioMinorista))} />
                  {" · "}mayorista{" "}
                  <MargenBadge margen={margenPorcentaje(Number(form.precioCosto), Number(form.precioMayorista))} />
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarEdicion}
                  className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
