"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  aplicarMargenGlobal,
  actualizarPreciosProducto,
} from "@/core/actions/precios.action";
import { formatearMoneda } from "@/lib/utils";
import { FormFeedback } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
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
  if (margen === null) return <span className="text-muted-foreground">—</span>;
  const color =
    margen < 0 ? "text-destructive" : margen < 10 ? "text-[#92400e]" : "text-[#065f46]";
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
  // Margen global en dos pasos: primero preview, recién ahí se ejecuta
  const [margenPendiente, setMargenPendiente] = useState<"minorista" | "mayorista" | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [editando, setEditando] = useState<ProductoPrecioFila | null>(null);
  const [form, setForm] = useState<FormPrecio | null>(null);
  const [guardando, setGuardando] = useState(false);

  function pedirAplicar(tipo: "minorista" | "mayorista") {
    const porcentaje = Number(tipo === "minorista" ? margenMinorista : margenMayorista);
    if (isNaN(porcentaje) || porcentaje < 0) {
      setMensaje({ tipo: "error", texto: "Ingresá un margen válido (0 o más)" });
      return;
    }
    setMensaje(null);
    setMargenPendiente(tipo);
  }

  async function ejecutarMargen() {
    if (!margenPendiente) return;
    const tipo = margenPendiente;
    const porcentaje = Number(tipo === "minorista" ? margenMinorista : margenMayorista);
    setAplicando(tipo);
    setMensaje(null);
    const resultado = await aplicarMargenGlobal({ tipo, porcentaje });
    setAplicando(null);
    setMargenPendiente(null);
    if (resultado.ok) {
      setMensaje({
        tipo: "exito",
        texto: `Margen del ${porcentaje}% aplicado a ${resultado.data?.actualizados ?? 0} productos con costo cargado`,
      });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  // Productos que se van a recalcular con el margen pendiente (los que tienen costo)
  const productosConCosto = productos.filter(
    (p) => p.precio_costo != null && Number(p.precio_costo) > 0,
  ).length;

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
      setMensaje({ tipo: "exito", texto: "Precios actualizados" });
      cerrarEdicion();
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  const filtrados = productos.filter((p) => {
    if (!busqueda.trim()) return true;
    return p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Con el modal abierto el banner de afuera queda tapado (z-50): se muestra adentro */}
      {mensaje && !editando && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      {/* Márgenes globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-primary mb-1">Margen minorista global</h3>
          <p className="text-xs text-muted-foreground mb-3">
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
                className="w-full border border-border rounded-lg pl-3 pr-8 py-2 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <button
              onClick={() => pedirAplicar("minorista")}
              disabled={aplicando !== null || margenPendiente !== null}
              className="px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {aplicando === "minorista" ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-primary mb-1">Margen mayorista global</h3>
          <p className="text-xs text-muted-foreground mb-3">
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
                className="w-full border border-border rounded-lg pl-3 pr-8 py-2 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <button
              onClick={() => pedirAplicar("mayorista")}
              disabled={aplicando !== null || margenPendiente !== null}
              className="px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {aplicando === "mayorista" ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview del margen global antes de tocar todos los precios */}
      {margenPendiente && (
        <div role="alert" className="border border-destructive/40 bg-destructive/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
          <p className="flex-1 text-sm text-foreground">
            Se van a recalcular los precios{" "}
            <span className="font-bold">{margenPendiente === "minorista" ? "minoristas" : "mayoristas"}</span>{" "}
            de <span className="font-bold">{productosConCosto} productos</span> con costo cargado al{" "}
            <span className="font-bold">
              {Number(margenPendiente === "minorista" ? margenMinorista : margenMayorista)}%
            </span>{" "}
            sobre el costo (nuevo precio = costo × (1 + margen/100)).{" "}
            <span className="font-semibold text-destructive">No hay deshacer.</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMargenPendiente(null)}
              disabled={aplicando !== null}
              className="px-4 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void ejecutarMargen()}
              disabled={aplicando !== null}
              className="px-4 py-2.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50"
            >
              {aplicando ? "Aplicando..." : `Aplicar a los ${productosConCosto} productos`}
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <input
        type="search"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full md:w-80 border border-border rounded-lg px-3 py-2 text-sm bg-card"
      />

      {/* Tabla de precios */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Producto</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Costo</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Precio minorista</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Margen min.</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Precio mayorista</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Margen may.</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">Editar</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => {
                const costo = p.precio_costo != null ? Number(p.precio_costo) : null;
                return (
                  <tr key={p.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{p.nombre}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {costo !== null ? formatearMoneda(costo) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatearMoneda(Number(p.precio_minorista))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <MargenBadge margen={margenPorcentaje(costo, Number(p.precio_minorista))} />
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {formatearMoneda(Number(p.precio_mayorista))}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <MargenBadge margen={margenPorcentaje(costo, Number(p.precio_mayorista))} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => abrirEdicion(p)}
                        className="px-2.5 py-1.5 text-xs border border-border text-muted-foreground rounded hover:bg-muted transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay productos para la búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal edición de precios */}
      {editando && form && (
        <Modal
          titulo="Editar precios"
          descripcion={editando.nombre}
          onCerrar={cerrarEdicion}
          ancho="max-w-md"
        >
          {mensaje && <FormFeedback tipo={mensaje.tipo} className="mb-3">{mensaje.texto}</FormFeedback>}
          <form onSubmit={guardarEdicion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Costo</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={form.precioCosto}
                  onChange={(e) => setForm({ ...form, precioCosto: e.target.value })}
                  placeholder="Sin costo cargado"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Precio minorista</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    value={form.precioMinorista}
                    onChange={(e) => setForm({ ...form, precioMinorista: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Precio mayorista</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    value={form.precioMayorista}
                    onChange={(e) => setForm({ ...form, precioMayorista: e.target.value })}
                    required
                  />
                </div>
              </div>
              {form.precioCosto !== "" && !isNaN(Number(form.precioCosto)) && Number(form.precioCosto) > 0 && (
                <p className="text-xs text-muted-foreground">
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
                  className="px-4 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
}
