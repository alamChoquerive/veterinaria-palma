"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { actualizarProductoBasico } from "@/core/actions/producto.action";
import { formatearMoneda } from "@/lib/utils";
import type { Producto } from "@/types/database.types";

export interface ProductoEmpleadoFila extends Producto {
  categoria?: string | null;
}

interface FormEdicion {
  nombre: string;
  imagenUrl: string;
}

/**
 * Catálogo del empleado: puede ver todo y editar SOLO el nombre y la
 * foto del producto (la escritura la hace la RPC actualizar_producto_basico).
 */
export function CatalogoEmpleadoTable({
  productos,
}: {
  productos: ProductoEmpleadoFila[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<ProductoEmpleadoFila | null>(null);
  const [form, setForm] = useState<FormEdicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtrados = productos.filter((p) => {
    if (!busqueda.trim()) return true;
    return p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  function abrirEdicion(p: ProductoEmpleadoFila) {
    setEditando(p);
    setForm({ nombre: p.nombre, imagenUrl: p.imagen_url ?? "" });
    setMensaje(null);
    setError(null);
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
    setError(null);
    const resultado = await actualizarProductoBasico({
      productoId: editando.id,
      nombre: form.nombre,
      imagenUrl: form.imagenUrl,
    });
    setGuardando(false);
    if (resultado.ok) {
      setMensaje("Producto actualizado correctamente");
      cerrarEdicion();
      router.refresh();
    } else {
      setError(resultado.error);
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white"
      />

      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Foto</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Producto</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Categoría</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Minorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Mayorista</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Stock</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Editar</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => (
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
                    <div className="font-medium text-sm">{p.nombre}</div>
                    {!p.activo && <span className="text-xs text-[#64748b]">Inactivo</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{p.categoria ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatearMoneda(Number(p.precio_minorista))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[#64748b]">
                    {formatearMoneda(Number(p.precio_mayorista))}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirEdicion(p)}
                      className="px-2.5 py-1.5 text-xs border border-[#e2e8f0] text-[#64748b] rounded hover:bg-[#f1f5f9] transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
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

      <p className="text-xs text-[#94a3b8]">
        Como empleado solo podés cambiar el nombre y la foto. Precios, stock y estado los
        administra el administrador.
      </p>

      {/* Modal de edición: solo nombre y foto */}
      {editando && form && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#1e293b] mb-4">Editar producto</h3>
            <form onSubmit={guardarEdicion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Nombre</label>
                <input
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">URL de la foto</label>
                <input
                  type="url"
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                  value={form.imagenUrl}
                  onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                />
              </div>
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
                  className="px-4 py-2 text-sm bg-[#0e7490] text-white rounded-lg hover:bg-[#155e75] disabled:opacity-50 transition-colors"
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
