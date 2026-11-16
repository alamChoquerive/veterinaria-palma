"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarEstadoTurno,
  cancelarTurno,
} from "@/core/actions/turnos.action";
import { ESPECIALIDADES } from "@/lib/data/especialidades";
import { formatearFecha } from "@/lib/utils";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { FormFeedback } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TurnoFila } from "@/components/admin/turnos-panel";

type FiltroFecha = "todos" | "semana" | "mes" | "fecha";
type FiltroEstado = "todos" | "pendiente" | "confirmado" | "atendido" | "cancelado";

function inicioDeSemana(d: Date): Date {
  const copia = new Date(d);
  const dia = (copia.getDay() + 6) % 7; // lunes = 0
  copia.setHours(0, 0, 0, 0);
  copia.setDate(copia.getDate() - dia);
  return copia;
}

export function AgendaView({ turnos }: { turnos: TurnoFila[] }) {
  const router = useRouter();
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>("todos");
  const [fechaElegida, setFechaElegida] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [cancelarPendiente, setCancelarPendiente] = useState<TurnoFila | null>(null);

  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);

  const turnosFiltrados = turnos.filter((t) => {
    const fechaTurno = new Date(`${t.fecha}T00:00:00`);

    if (filtroFecha === "semana") {
      if (fechaTurno < inicioDeSemana(new Date())) return false;
    } else if (filtroFecha === "mes") {
      if (
        fechaTurno.getFullYear() !== hoy.getFullYear() ||
        fechaTurno.getMonth() !== hoy.getMonth()
      ) {
        return false;
      }
    } else if (filtroFecha === "fecha") {
      if (!fechaElegida || t.fecha !== fechaElegida) return false;
    }

    if (filtroEspecialidad !== "todas") {
      if ((t.especialidad ?? "Sin especialidad") !== filtroEspecialidad) return false;
    }

    if (filtroEstado !== "todos" && t.estado !== filtroEstado) return false;

    return true;
  });

  async function cambiarEstado(t: TurnoFila, estado: "confirmado" | "atendido" | "cancelado") {
    setCargando(true);
    setMensaje(null);
    const resultado =
      estado === "cancelado"
        ? await cancelarTurno(t.id)
        : await actualizarEstadoTurno(t.id, estado);
    setCargando(false);
    if (resultado.ok) {
      setMensaje({
        tipo: "exito",
        texto: `Turno ${estado === "cancelado" ? "cancelado" : estado === "atendido" ? "marcado como atendido" : "confirmado"}`,
      });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  const estiloFiltro = (activo: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      activo
        ? "bg-primary text-primary-foreground"
        : "bg-card border border-border text-muted-foreground hover:bg-muted/50"
    }`;

  return (
    <div className="space-y-4">
      {/* Filtros horizontales */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase mr-1">Fecha:</span>
        {(["todos", "semana", "mes", "fecha"] as FiltroFecha[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltroFecha(f)}
            className={estiloFiltro(filtroFecha === f)}
          >
            {f === "todos" ? "Todos" : f === "semana" ? "Esta semana" : f === "mes" ? "Este mes" : "Elegir fecha"}
          </button>
        ))}
        {filtroFecha === "fecha" && (
          <input
            type="date"
            value={fechaElegida}
            onChange={(e) => setFechaElegida(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-xs"
          />
        )}

        <span className="text-xs font-semibold text-muted-foreground uppercase mx-1 ml-3">Especialidad:</span>
        <select
          value={filtroEspecialidad}
          onChange={(e) => setFiltroEspecialidad(e.target.value)}
          className="border border-border rounded-lg px-3 py-1.5 text-xs bg-card text-primary"
        >
          <option value="todas">Todas</option>
          {ESPECIALIDADES.map((e) => (
            <option key={e.id} value={e.nombre}>{e.nombre}</option>
          ))}
        </select>

        <span className="text-xs font-semibold text-muted-foreground uppercase mx-1 ml-3">Estado:</span>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
          className="border border-border rounded-lg px-3 py-1.5 text-xs bg-card text-primary"
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="atendido">Atendido</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {mensaje && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Hora</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Especialidad</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Mascota</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Responsable</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnosFiltrados.length > 0 ? (
              turnosFiltrados.map((t) => {
                const responsable =
                  t.responsable_nombre?.trim() ||
                  (t.perfiles
                    ? `${t.perfiles.nombre ?? ""} ${t.perfiles.apellido ?? ""}`.trim() ||
                      t.perfiles.email
                    : null) ||
                  "Sin asignar";
                const mascota = t.mascota_nombre
                  ? `${t.mascota_nombre}${t.mascota_especie ? ` (${t.mascota_especie})` : ""}`
                  : "—";
                return (
                  <tr key={t.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{formatearFecha(t.fecha)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-primary">
                      {t.hora_inicio.slice(0, 5)} - {t.hora_fin.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 text-sm">{t.especialidad ?? "Sin especialidad"}</td>
                    <td className="px-4 py-3 text-sm">{mascota}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{responsable}</div>
                      {(t.responsable_telefono ?? "").trim() && (
                        <div className="text-xs text-muted-foreground">{t.responsable_telefono}</div>
                      )}
                      {t.motivo && (
                        <div className="text-xs text-muted-foreground italic">{t.motivo}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={t.estado} tipo="turno" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.estado === "pendiente" && (
                        <span className="space-x-2">
                          <button
                            onClick={() => cambiarEstado(t, "confirmado")}
                            disabled={cargando}
                            className="text-xs text-[#1e40af] hover:underline disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setCancelarPendiente(t)}
                            disabled={cargando}
                            className="text-xs text-destructive hover:underline disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </span>
                      )}
                      {t.estado === "confirmado" && (
                        <span className="space-x-2">
                          <button
                            onClick={() => cambiarEstado(t, "atendido")}
                            disabled={cargando}
                            className="text-xs text-[#065f46] hover:underline disabled:opacity-50"
                          >
                            Atendido
                          </button>
                          <button
                            onClick={() => setCancelarPendiente(t)}
                            disabled={cargando}
                            className="text-xs text-destructive hover:underline disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </span>
                      )}
                      {(t.estado === "atendido" || t.estado === "cancelado") && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay turnos para los filtros elegidos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancelar turno: primero confirmación con texto a tipear */}
      {cancelarPendiente && (
        <ConfirmDialog
          titulo="Cancelar turno"
          descripcion={
            <>
              {formatearFecha(cancelarPendiente.fecha)} ·{" "}
              {cancelarPendiente.hora_inicio.slice(0, 5)} —{" "}
              {cancelarPendiente.mascota_nombre || cancelarPendiente.responsable_nombre || "sin datos"}
              . El cliente va a ver el turno como cancelado.{" "}
              <span className="font-semibold text-destructive">No se puede deshacer.</span>
            </>
          }
          textoConfirmacion="CANCELAR"
          etiquetaConfirmar="Cancelar turno"
          cargando={cargando}
          onConfirmar={() => {
            const t = cancelarPendiente;
            setCancelarPendiente(null);
            void cambiarEstado(t, "cancelado");
          }}
          onCerrar={() => setCancelarPendiente(null)}
        />
      )}
    </div>
  );
}
