"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { actualizarProducto } from "@/core/actions/producto.action";
import { formatearMoneda } from "@/lib/utils";
import { FormFeedback } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import type { Producto } from "@/types/database.types";

export interface CategoriaFila {
  id: string;
  nombre: string;
}

export interface ProductoCatalogoFila extends Producto {
  categoria?: string | null;
}

interface FormEdicion {
  nombre: string;
  imagenUrl: string;
  categoriaId: string;
  precioMinorista: string;
  precioMayorista: string;
  stock: string;
}

export function CatalogoTable({
  productos,
  categorias,
}: {
  productos: ProductoCatalogoFila[];
  categorias: CategoriaFila[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [editando, setEditando] = useState<ProductoCatalogoFila | null>(null);
  const [form, setForm] = useState<FormEdicion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const filtrados = productos.filter((p) => {
    if (filtroCategoria !== "todas" && p.categoria_id !== filtroCategoria) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      if (!p.nombre.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function abrirEdicion(p: ProductoCatalogoFila) {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      imagenUrl: p.imagen_url ?? "",
      categoriaId: p.categoria_id ?? "",
      precioMinorista: String(p.precio_minorista),
      precioMayorista: String(p.precio_mayorista),
      stock: String(p.stock),
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
      categoriaId: form.categoriaId || null,
      imagenUrl: form.imagenUrl,
      precioMinorista: Number(form.precioMinorista),
      precioMayorista: Number(form.precioMayorista),
      stock: Number(form.stock),
      stockMinimo: editando.stock_minimo,
      activo: editando.activo,
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
      {/* Buscador + filtro de categoría */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <input
          type="search"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-card"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-primary"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Con el modal abierto el banner de afuera queda tapado (z-50): se muestra adentro */}
      {mensaje && !editando && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      {/* Lista de productos */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Foto</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Producto</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Categoría</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Minorista</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Mayorista</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">Stock</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">Editar</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => (
                <tr key={p.id} className="border-b hover:bg-muted/50 transition-colors">
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
                    {!p.activo && (
                      <span className="text-xs text-muted-foreground">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{p.categoria ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatearMoneda(Number(p.precio_minorista))}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                    {formatearMoneda(Number(p.precio_mayorista))}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirEdicion(p)}
                      className="px-2.5 py-1.5 text-xs border border-border text-muted-foreground rounded hover:bg-muted transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay productos para los filtros elegidos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edición */}
      {editando && form && (
        <Modal titulo="Editar producto" onCerrar={cerrarEdicion} ancho="max-w-md">
          {mensaje && <FormFeedback tipo={mensaje.tipo} className="mb-3">{mensaje.texto}</FormFeedback>}
          <form onSubmit={guardarEdicion} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">URL de la foto</label>
                <input
                  type="url"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="https://..."
                  value={form.imagenUrl}
                  onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Categoría</label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
                  value={form.categoriaId}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
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
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stock</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
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
