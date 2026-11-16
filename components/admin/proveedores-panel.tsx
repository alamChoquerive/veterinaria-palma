"use client";

import { useState } from "react";
import { FormFeedback } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import {
  crearProveedor,
  actualizarProveedor,
} from "@/core/actions/proveedores.action";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import type { Proveedor } from "@/types/database.types";

interface FormProveedor {
  nombre: string;
  contactoNombre: string;
  email: string;
  telefono: string;
  categoria: string;
  descripcion: string;
  activo: boolean;
  montoPendiente: string;
  ultimoPedidoFecha: string;
}

const FORM_INICIAL: FormProveedor = {
  nombre: "",
  contactoNombre: "",
  email: "",
  telefono: "",
  categoria: "",
  descripcion: "",
  activo: true,
  montoPendiente: "0",
  ultimoPedidoFecha: "",
};

function formDeProveedor(p: Proveedor): FormProveedor {
  return {
    nombre: p.nombre,
    contactoNombre: p.contacto_nombre ?? "",
    email: p.email ?? "",
    telefono: p.telefono ?? "",
    categoria: p.categoria,
    descripcion: p.descripcion ?? "",
    activo: p.activo,
    montoPendiente: String(p.monto_pendiente),
    ultimoPedidoFecha: p.ultimo_pedido_fecha ?? "",
  };
}

export function ProveedoresPanel({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter();
  const [expandido, setExpandido] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<FormProveedor>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function abrirNuevo() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setError(null);
    setModalAbierto(true);
  }

  function abrirEditar(p: Proveedor) {
    setEditando(p);
    setForm(formDeProveedor(p));
    setError(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
    setForm(FORM_INICIAL);
    setError(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);

    const datos = {
      nombre: form.nombre,
      contactoNombre: form.contactoNombre || undefined,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      categoria: form.categoria,
      descripcion: form.descripcion || undefined,
      activo: form.activo,
      montoPendiente: Number(form.montoPendiente),
      ultimoPedidoFecha: form.ultimoPedidoFecha || undefined,
    };

    const resultado = editando
      ? await actualizarProveedor({ proveedorId: editando.id, ...datos })
      : await crearProveedor(datos);

    setGuardando(false);

    if (resultado.ok) {
      setMensaje(editando ? "Proveedor actualizado" : "Proveedor creado");
      cerrarModal();
      router.refresh();
    } else {
      setError(resultado.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Proveedores</h2>
          <p className="text-muted-foreground">Proveedores actuales de la tienda.</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          + Nuevo proveedor
        </button>
      </div>

      {mensaje && <FormFeedback tipo="exito">{mensaje}</FormFeedback>}

      {/* Lista vertical de bloques */}
      <div className="space-y-3">
        {proveedores.length > 0 ? (
          proveedores.map((p) => {
            const abierto = expandido === p.id;
            return (
              <div
                key={p.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandido(abierto ? null : p.id)}
                  className="w-full flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{p.nombre}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        p.activo
                          ? "bg-[#d1fae5] text-[#065f46]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Provee: {p.categoria}</span>
                    {Number(p.monto_pendiente) > 0 ? (
                      <span className="font-bold text-destructive">
                        Pendiente: {formatearMoneda(Number(p.monto_pendiente))}
                      </span>
                    ) : (
                      <span className="font-bold text-[#065f46]">Pagado</span>
                    )}
                    <span className="text-muted-foreground text-xs">{abierto ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Desplegable con el detalle */}
                {abierto && (
                  <div className="border-t border-border px-5 py-4 bg-muted/50 space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Contacto: </span>
                        <span className="font-medium">{p.contacto_nombre || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email: </span>
                        <span className="font-medium">{p.email || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Teléfono: </span>
                        <span className="font-medium">{p.telefono || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Categoría: </span>
                        <span className="font-medium">{p.categoria}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Último pedido: </span>
                        <span className="font-medium">
                          {p.ultimo_pedido_fecha ? formatearFecha(p.ultimo_pedido_fecha) : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Monto pendiente: </span>
                        <span className={`font-bold ${Number(p.monto_pendiente) > 0 ? "text-destructive" : "text-[#065f46]"}`}>
                          {Number(p.monto_pendiente) > 0
                            ? formatearMoneda(Number(p.monto_pendiente))
                            : "Pagado"}
                        </span>
                      </div>
                    </div>
                    {p.descripcion && (
                      <div>
                        <span className="text-muted-foreground">Descripción: </span>
                        <span>{p.descripcion}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <button
                        onClick={() => abrirEditar(p)}
                        className="px-3 py-1.5 text-xs border border-border bg-card text-muted-foreground rounded hover:bg-muted transition-colors"
                      >
                        Editar proveedor
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            Todavía no hay proveedores cargados
          </div>
        )}
      </div>

      {/* Modal nuevo/editar */}
      {modalAbierto && (
        <Modal
          titulo={editando ? "Editar proveedor" : "Nuevo proveedor"}
          onCerrar={cerrarModal}
          ancho="max-w-lg"
        >
          {error && <FormFeedback tipo="error" className="mb-4">{error}</FormFeedback>}
          <form onSubmit={guardar} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Nombre del proveedor <span className="text-destructive">*</span>
                </label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  minLength={2}
                  maxLength={120}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Contacto</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    value={form.contactoNombre}
                    onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })}
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Teléfono</label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    maxLength={30}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    ¿Qué provee? <span className="text-destructive">*</span>
                  </label>
                  <input
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="Alimentos, farmacia, accesorios..."
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Último pedido</label>
                  <input
                    type="date"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    value={form.ultimoPedidoFecha}
                    onChange={(e) => setForm({ ...form, ultimoPedidoFecha: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Monto pendiente a pagar
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={form.montoPendiente}
                  onChange={(e) => setForm({ ...form, montoPendiente: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Descripción</label>
                <textarea
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  maxLength={1000}
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Proveedor activo
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear proveedor"}
                </button>
              </div>
            </form>
        </Modal>
      )}
    </div>
  );
}
