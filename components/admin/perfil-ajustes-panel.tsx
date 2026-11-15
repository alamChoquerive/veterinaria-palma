"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  actualizarPerfilPropio,
  actualizarDatosTienda,
  actualizarNotificaciones,
  crearEmpleado,
  eliminarUsuario,
} from "@/core/actions/perfil.action";
import { formatearFecha } from "@/lib/utils";
import type { Perfil } from "@/types/database.types";

const ETIQUETA_ROL: Record<string, string> = {
  admin: "Admin",
  empleado: "Empleado",
  mayorista: "Mayorista",
  minorista: "Minorista",
};

const COLOR_ROL: Record<string, string> = {
  admin: "bg-[#1e293b] text-white",
  empleado: "bg-[#dbeafe] text-[#1e40af]",
  mayorista: "bg-[#fef3c7] text-[#92400e]",
  minorista: "bg-[#e2e8f0] text-[#64748b]",
};

function Panel({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <h3 className="font-semibold text-[#1e293b] mb-1">{titulo}</h3>
      {descripcion && <p className="text-xs text-[#64748b] mb-4">{descripcion}</p>}
      {children}
    </section>
  );
}

function BotonGuardar({ cargando, children }: { cargando: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={cargando}
      className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
    >
      {cargando ? "Guardando..." : children}
    </button>
  );
}

const inputCls =
  "w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm";

export function PerfilAjustesPanel({
  perfilActual,
  config,
  usuarios,
}: {
  perfilActual: Perfil | null;
  config: Record<string, string>;
  usuarios: Perfil[];
}) {
  const router = useRouter();
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Mi perfil
  const [perfilForm, setPerfilForm] = useState({
    nombre: perfilActual?.nombre ?? "",
    apellido: perfilActual?.apellido ?? "",
    telefono: perfilActual?.telefono ?? "",
    fotoUrl: perfilActual?.foto_url ?? "",
  });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Datos de la tienda
  const [tiendaForm, setTiendaForm] = useState({
    nombreTienda: config["nombre_tienda"] ?? "",
    cuit: config["cuit"] ?? "",
    direccion: config["direccion"] ?? "",
    telefonoTienda: config["telefono_tienda"] ?? "",
  });
  const [guardandoTienda, setGuardandoTienda] = useState(false);

  // Notificaciones
  const [notifForm, setNotifForm] = useState({
    stockBajo: (config["notif_stock_bajo"] ?? "true") === "true",
    nuevoPedido: (config["notif_nuevo_pedido"] ?? "true") === "true",
    pagoConfirmado: (config["notif_pago_confirmado"] ?? "true") === "true",
    turnoNuevo: (config["notif_turno_nuevo"] ?? "true") === "true",
  });
  const [guardandoNotif, setGuardandoNotif] = useState(false);

  // Equipo
  const [modalEmpleado, setModalEmpleado] = useState(false);
  const [empleadoForm, setEmpleadoForm] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
  });
  const [guardandoEmpleado, setGuardandoEmpleado] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  async function guardarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoPerfil(true);
    setMensaje(null);
    const resultado = await actualizarPerfilPropio({
      nombre: perfilForm.nombre,
      apellido: perfilForm.apellido,
      telefono: perfilForm.telefono || undefined,
      fotoUrl: perfilForm.fotoUrl,
    });
    setGuardandoPerfil(false);
    setMensaje(resultado.ok ? "Perfil actualizado" : resultado.error);
    if (resultado.ok) router.refresh();
  }

  async function guardarTienda(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoTienda(true);
    setMensaje(null);
    const resultado = await actualizarDatosTienda({
      nombreTienda: tiendaForm.nombreTienda,
      cuit: tiendaForm.cuit || undefined,
      direccion: tiendaForm.direccion || undefined,
      telefonoTienda: tiendaForm.telefonoTienda || undefined,
    });
    setGuardandoTienda(false);
    setMensaje(resultado.ok ? "Datos de la tienda guardados" : resultado.error);
    if (resultado.ok) router.refresh();
  }

  async function guardarNotificaciones(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoNotif(true);
    setMensaje(null);
    const resultado = await actualizarNotificaciones(notifForm);
    setGuardandoNotif(false);
    setMensaje(resultado.ok ? "Notificaciones guardadas" : resultado.error);
  }

  async function guardarEmpleado(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoEmpleado(true);
    setMensaje(null);
    const resultado = await crearEmpleado(empleadoForm);
    setGuardandoEmpleado(false);
    if (resultado.ok) {
      setMensaje("Empleado creado con rol empleado");
      setModalEmpleado(false);
      setEmpleadoForm({ email: "", password: "", nombre: "", apellido: "" });
      router.refresh();
    } else {
      setMensaje(resultado.error);
    }
  }

  async function eliminar(perfilId: string) {
    setEliminando(perfilId);
    setMensaje(null);
    const resultado = await eliminarUsuario({ perfilId });
    setEliminando(null);
    setMensaje(resultado.ok ? "Usuario eliminado" : resultado.error);
    if (resultado.ok) router.refresh();
  }

  const NOTIFICACIONES: Array<{
    clave: keyof typeof notifForm;
    titulo: string;
    descripcion: string;
  }> = [
    { clave: "stockBajo", titulo: "Stock bajo", descripcion: "Avisar cuando un producto llegue a su stock mínimo" },
    { clave: "nuevoPedido", titulo: "Nuevo pedido", descripcion: "Avisar cuando un cliente haga un pedido" },
    { clave: "pagoConfirmado", titulo: "Pago confirmado", descripcion: "Avisar cuando se confirme un pago de Mercado Pago" },
    { clave: "turnoNuevo", titulo: "Turno nuevo", descripcion: "Avisar cuando se registre un turno nuevo" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Perfil/Ajustes</h2>
        <p className="text-[#64748b]">Tu perfil, la tienda, las notificaciones y el equipo.</p>
      </div>

      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mi perfil */}
        <Panel
          titulo="Mi perfil"
          descripcion="Tus datos personales. El email no editable desde acá (por seguridad)."
        >
          <form onSubmit={guardarPerfil} className="space-y-3">
            <div className="flex items-center gap-4">
              <Image
                src={perfilForm.fotoUrl || "/placeholder.svg"}
                alt="Foto de perfil"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full object-cover border border-[#e2e8f0]"
              />
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#64748b] mb-1">URL de la foto</label>
                <input
                  type="url"
                  className={inputCls}
                  placeholder="https://..."
                  value={perfilForm.fotoUrl}
                  onChange={(e) => setPerfilForm({ ...perfilForm, fotoUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Nombre</label>
                <input
                  className={inputCls}
                  value={perfilForm.nombre}
                  onChange={(e) => setPerfilForm({ ...perfilForm, nombre: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Apellido</label>
                <input
                  className={inputCls}
                  value={perfilForm.apellido}
                  onChange={(e) => setPerfilForm({ ...perfilForm, apellido: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Teléfono</label>
              <input
                className={inputCls}
                value={perfilForm.telefono}
                onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })}
                maxLength={30}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Email (solo lectura)</label>
              <input className={`${inputCls} bg-[#f8fafc] text-[#64748b]`} value={perfilActual?.email ?? ""} disabled readOnly />
            </div>
            <div className="flex justify-end">
              <BotonGuardar cargando={guardandoPerfil}>Guardar perfil</BotonGuardar>
            </div>
          </form>
        </Panel>

        {/* Datos de la tienda */}
        <Panel titulo="Datos de la tienda" descripcion="Se muestran en la tienda y los comprobantes.">
          <form onSubmit={guardarTienda} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Nombre</label>
              <input
                className={inputCls}
                value={tiendaForm.nombreTienda}
                onChange={(e) => setTiendaForm({ ...tiendaForm, nombreTienda: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">CUIT</label>
              <input
                className={inputCls}
                value={tiendaForm.cuit}
                onChange={(e) => setTiendaForm({ ...tiendaForm, cuit: e.target.value })}
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Dirección</label>
              <input
                className={inputCls}
                value={tiendaForm.direccion}
                onChange={(e) => setTiendaForm({ ...tiendaForm, direccion: e.target.value })}
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Teléfono</label>
              <input
                className={inputCls}
                value={tiendaForm.telefonoTienda}
                onChange={(e) => setTiendaForm({ ...tiendaForm, telefonoTienda: e.target.value })}
                maxLength={30}
              />
            </div>
            <div className="flex justify-end">
              <BotonGuardar cargando={guardandoTienda}>Guardar tienda</BotonGuardar>
            </div>
          </form>
        </Panel>
      </div>

      {/* Notificaciones */}
      <Panel titulo="Notificaciones" descripcion="Elegí qué eventos te notifican.">
        <form onSubmit={guardarNotificaciones} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NOTIFICACIONES.map((n) => (
              <label
                key={n.clave}
                className="flex items-start gap-3 border border-[#e2e8f0] rounded-lg px-4 py-3 cursor-pointer hover:bg-[#f8fafc] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={notifForm[n.clave]}
                  onChange={(e) => setNotifForm({ ...notifForm, [n.clave]: e.target.checked })}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-[#1e293b]">{n.titulo}</span>
                  <span className="block text-xs text-[#64748b]">{n.descripcion}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <BotonGuardar cargando={guardandoNotif}>Guardar notificaciones</BotonGuardar>
          </div>
        </form>
      </Panel>

      {/* Equipo / usuarios */}
      <Panel
        titulo="Equipo / usuarios"
        descripcion="Solo el administrador puede agregar empleados o eliminar usuarios."
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setModalEmpleado(true)}
            className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] transition-colors font-medium"
          >
            + Agregar empleado
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-[#f8fafc]">
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Rol</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Alta</th>
                <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esYo = u.id === perfilActual?.id;
                const esAdmin = u.rol === "admin";
                return (
                  <tr key={u.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      {`${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() || "—"}
                      {esYo && <span className="ml-2 text-xs text-[#64748b]">(vos)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ROL[u.rol] ?? "bg-[#e2e8f0] text-[#64748b]"}`}
                      >
                        {ETIQUETA_ROL[u.rol] ?? u.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatearFecha(u.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      {esYo || esAdmin ? (
                        <span className="text-xs text-[#94a3b8]">—</span>
                      ) : (
                        <button
                          onClick={() => eliminar(u.id)}
                          disabled={eliminando !== null}
                          className="text-xs text-destructive hover:underline disabled:opacity-50"
                        >
                          {eliminando === u.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal agregar empleado */}
      {modalEmpleado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[#1e293b] mb-4">Agregar empleado</h3>
            <form onSubmit={guardarEmpleado} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Nombre</label>
                  <input
                    className={inputCls}
                    value={empleadoForm.nombre}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, nombre: e.target.value })}
                    required
                    minLength={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Apellido</label>
                  <input
                    className={inputCls}
                    value={empleadoForm.apellido}
                    onChange={(e) => setEmpleadoForm({ ...empleadoForm, apellido: e.target.value })}
                    required
                    minLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Email</label>
                <input
                  type="email"
                  className={inputCls}
                  value={empleadoForm.email}
                  onChange={(e) => setEmpleadoForm({ ...empleadoForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Contraseña</label>
                <input
                  type="password"
                  className={inputCls}
                  value={empleadoForm.password}
                  onChange={(e) => setEmpleadoForm({ ...empleadoForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-[#64748b]">
                El empleado entra con rol &ldquo;empleado&rdquo; y ve su panel restringido.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEmpleado(false)}
                  className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEmpleado}
                  className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                >
                  {guardandoEmpleado ? "Creando..." : "Crear empleado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
