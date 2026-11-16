"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { actualizarProductoBasico } from "@/core/actions/producto.action";
import { formatearMoneda } from "@/lib/utils";
import { FormFeedback } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
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
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const filtrados = productos.filter((p) => {
    if (!busqueda.trim()) return true;
    return p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
  });

  function abrirEdicion(p: ProductoEmpleadoFila) {
    setEditando(p);
    setForm({ nombre: p.nombre, imagenUrl: p.imagen_url ?? "" });
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
    const resultado = await actualizarProductoBasico({
      productoId: editando.id,
      nombre: form.nombre,
      imagenUrl: form.imagenUrl,
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
      <input
        type="search"
        placeholder="Buscar producto..."
        aria-label="Buscar producto"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background"
      />

      {/* Con el modal abierto el banner de afuera queda tapado (z-50): se muestra adentro */}
      {mensaje && !editando && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[680px] text-left border-collapse">
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
                    {!p.activo && <span className="text-xs text-muted-foreground">Inactivo</span>}
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
                      className="inline-flex items-center justify-center min-h-11 px-3 text-xs border border-border text-muted-foreground rounded hover:bg-muted transition-colors"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
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

      <p className="text-xs text-muted-foreground">
        Como empleado solo podés cambiar el nombre y la foto. Precios, stock y estado los
        administra el administrador.
      </p>

      {/* Modal de edición: solo nombre y foto (Modal compartido: role=dialog, Esc, backdrop) */}
      {editando && form && (
        <Modal titulo="Editar producto" onCerrar={cerrarEdicion} ancho="max-w-md">
          {mensaje && <FormFeedback tipo={mensaje.tipo} className="mb-3">{mensaje.texto}</FormFeedback>}
          <form onSubmit={guardarEdicion} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                minLength={2}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">URL de la foto</label>
              <input
                type="url"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background"
                placeholder="https://..."
                value={form.imagenUrl}
                onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
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
