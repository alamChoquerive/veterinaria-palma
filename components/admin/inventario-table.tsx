"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { actualizarStock } from "@/core/actions/stock.action";
import { actualizarProducto } from "@/core/actions/producto.action";
import { formatearMoneda } from "@/lib/utils";
import { FormFeedback } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import type { Producto } from "@/types/database.types";

export interface ProductoFila extends Producto {
  categoria?: string | null;
}

interface FormEdicion {
  nombre: string;
  descripcion: string;
  precioMinorista: string;
  precioMayorista: string;
  stock: string;
  stockMinimo: string;
  activo: boolean;
}

export function InventarioTable({
  productos,
  soloLectura = false,
}: {
  productos: ProductoFila[];
  soloLectura?: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [editando, setEditando] = useState<ProductoFila | null>(null);
  const [form, setForm] = useState<FormEdicion | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function ajustarStock(id: string, cantidad: number) {
    setCargando(true);
    setMensaje(null);
    const resultado = await actualizarStock({ productoId: id, cantidad });
    setCargando(false);
    if (resultado.ok) {
      setMensaje({ tipo: "exito", texto: "Stock actualizado correctamente" });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  function abrirEdicion(p: ProductoFila) {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      precioMinorista: String(p.precio_minorista),
      precioMayorista: String(p.precio_mayorista),
      stock: String(p.stock),
      stockMinimo: String(p.stock_minimo),
      activo: p.activo,
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
    const resultado = await actualizarProducto({
      productoId: editando.id,
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      precioMinorista: Number(form.precioMinorista),
      precioMayorista: Number(form.precioMayorista),
      stock: Number(form.stock),
      stockMinimo: Number(form.stockMinimo),
      activo: form.activo,
    });
    setGuardando(false);
    if (resultado.ok) {
      setMensaje({ tipo: "exito", texto: "Producto actualizado correctamente" });
      cerrarEdicion();
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  return (
    <div className="space-y-4">
      {/* Con el modal abierto el banner de afuera queda tapado (z-50): se muestra adentro */}
      {mensaje && !editando && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Foto</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Producto</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Precio Minorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Precio Mayorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Stock</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Mínimo</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Estado</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => {
              const bajo = Number(p.stock) <= Number(p.stock_minimo);
              return (
                <tr key={p.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3">
                    <Image
                      src={p.imagen_url ?? "/placeholder.svg"}
                      alt={p.nombre}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.nombre}</div>
                    <div className="text-xs text-[#64748b]">{p.categoria ?? "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatearMoneda(Number(p.precio_minorista))}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#64748b]">
                    {formatearMoneda(Number(p.precio_mayorista))}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      bajo ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#d1fae5] text-[#065f46]"
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-[#64748b]">
                    {p.stock_minimo}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      !p.activo
                        ? "bg-[#e2e8f0] text-[#64748b]"
                        : bajo
                          ? "bg-[#fee2e2] text-[#991b1b]"
                          : "bg-[#d1fae5] text-[#065f46]"
                    }`}>
                      {!p.activo ? "Inactivo" : bajo ? "Crítico" : "Óptimo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-1">
                    {soloLectura ? (
                      <span className="text-xs text-[#94a3b8]">—</span>
                    ) : (
                      <>
                        <button
                          onClick={() => ajustarStock(p.id, 1)}
                          disabled={cargando}
                          className="inline-flex items-center justify-center min-w-11 min-h-11 px-2 text-sm font-bold bg-[#1e293b] text-white rounded hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                          aria-label={`Aumentar stock de ${p.nombre}`}
                        >
                          +1
                        </button>
                        <button
                          onClick={() => ajustarStock(p.id, -1)}
                          disabled={cargando}
                          className="inline-flex items-center justify-center min-w-11 min-h-11 px-2 text-sm font-bold bg-[#1e293b] text-white rounded hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                          aria-label={`Disminuir stock de ${p.nombre}`}
                        >
                          -1
                        </button>
                        <button
                          onClick={() => abrirEdicion(p)}
                          className="inline-flex items-center justify-center min-h-11 px-3 text-xs border border-[#e2e8f0] text-[#64748b] rounded hover:bg-[#f1f5f9] transition-colors"
                        >
                          Editar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cargando && <p className="text-sm text-[#64748b]">Cargando...</p>}

      {/* Modal de edición (solo en modo editable) */}
      {!soloLectura && editando && form && (
        <Modal titulo="Editar producto" onCerrar={cerrarEdicion} ancho="max-w-md">
          {mensaje && <FormFeedback tipo={mensaje.tipo} className="mb-3">{mensaje.texto}</FormFeedback>}
          <form onSubmit={guardarEdicion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Nombre</label>
                <input
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Descripción</label>
                <textarea
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  maxLength={500}
                  rows={2}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Stock mínimo</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    value={form.stockMinimo}
                    onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#64748b]">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Producto activo (visible en el catálogo)
              </label>
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
