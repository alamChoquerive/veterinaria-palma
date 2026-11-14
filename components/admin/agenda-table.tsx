"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelarTurno } from "@/core/actions/turnos.action";
import { formatearFecha } from "@/lib/utils";
import type { Turno } from "@/types/database.types";

export interface TurnoFila extends Turno {
  perfiles?: {
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
  } | null;
}

const ESTADOS = ["pendiente", "confirmado", "atendido", "cancelado"] as const;

const COLOR_ESTADO: Record<string, string> = {
  pendiente: "bg-[#fef3c7] text-[#92400e]",
  confirmado: "bg-[#dbeafe] text-[#1e40af]",
  atendido: "bg-[#d1fae5] text-[#065f46]",
  cancelado: "bg-[#fee2e2] text-[#991b1b]",
};

export function AgendaTable({ turnos }: { turnos: TurnoFila[] }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "pendiente" | "confirmado" | "atendido" | "cancelado"
  >("todos");
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cambiarEstado(id: string, nuevoEstado: string) {
    if (nuevoEstado !== "cancelado") return;
    setCargando(true);
    setMensaje(null);
    const resultado = await cancelarTurno(id);
    setCargando(false);
    if (resultado.ok) {
      setMensaje("Turno cancelado");
      // La page (server) se vuelve a leer con el estado actualizado
      router.refresh();
    } else {
      setMensaje(resultado.error);
    }
  }

  const turnosFiltrados =
    filtroEstado === "todos"
      ? turnos
      : turnos.filter((t) => t.estado === filtroEstado);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Agenda de turnos</h2>
          <p className="text-[#64748b]">Gestión de turnos de clientes.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltroEstado("todos")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              filtroEstado === "todos"
                ? "bg-[#1e293b] text-white"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
            }`}
          >
            Todos
          </button>
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                filtroEstado === e
                  ? "bg-[#1e293b] text-white"
                  : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Fecha</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Hora</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Mascota / Dueño</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Estado</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnosFiltrados.length > 0 ? (
              turnosFiltrados.map((t) => {
                const dueño = t.perfiles
                  ? `${t.perfiles.nombre ?? ""} ${t.perfiles.apellido ?? ""}`.trim() || t.perfiles.email
                  : "Sin asignar";
                return (
                  <tr key={t.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{formatearFecha(t.fecha)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#1e293b]">
                      {t.hora_inicio} - {t.hora_fin}
                    </td>
                    <td className="px-4 py-3 text-sm">{dueño}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ESTADO[t.estado] ?? "bg-[#e2e8f0] text-[#64748b]"}`}
                      >
                        {t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.estado === "pendiente" ? (
                        <button
                          onClick={() => cambiarEstado(t.id, "cancelado")}
                          disabled={cargando}
                          className="text-xs text-destructive hover:underline disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      ) : (
                        <span className="text-xs text-[#64748b]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  No hay turnos para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cargando && <p className="text-sm text-[#64748b]">Cargando...</p>}
    </div>
  );
}
