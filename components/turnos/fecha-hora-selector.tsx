"use client";

import { useEffect, useState } from "react";
import type { Especialidad } from "@/lib/data/especialidades";
import { HORARIOS_TURNO } from "@/lib/constants";
import { obtenerDisponibilidadTurnos } from "@/core/actions/turnos.action";
import { fechaLocalISO, formatearFecha } from "@/lib/utils";

interface FechaHoraSelectorProps {
  especialidad: Especialidad;
  fechaSeleccionada: string | null;
  horaSeleccionada: string | null;
  /** bump para reconsultar disponibilidad (ej. tras un error de slot ocupado) */
  disponibilidadKey?: number;
  onSeleccionarFecha: (fecha: string) => void;
  onSeleccionarHora: (hora: string) => void;
}

const DIAS_NUM: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  domingo: 0,
};

function aMinutos(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function deMinutos(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generarFechas(dias: string[]): string[] {
  const fechas: string[] = [];
  const hoy = new Date();
  for (let i = 0; i < 30; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);
    const diaNum = fecha.getDay();
    if (dias.some((d) => DIAS_NUM[d] === diaNum)) {
      fechas.push(fechaLocalISO(fecha)); // fecha LOCAL, sin pasar por UTC
    }
  }
  return fechas.slice(0, 8);
}

/**
 * Slots válidos para la especialidad:alineados al intervalo, dentro de
 * 09:00–17:00 y con hora_fin (inicio + duración) dentro del horario.
 * Antes se generaban 16 horas fijas 9:00–16:30 y la RPC rechazaba los que
 * se pasaban de 17:00 (ej. 16:30 en Cardiología de 60 min).
 */
function generarHorarios(duracion: number): string[] {
  const desde = aMinutos(HORARIOS_TURNO.DESDE);
  const hasta = aMinutos(HORARIOS_TURNO.HASTA);
  const intervalo = HORARIOS_TURNO.INTERVALO_MINUTOS;
  const horarios: string[] = [];
  for (let m = desde; m + duracion <= hasta; m += intervalo) {
    horarios.push(deMinutos(m));
  }
  return horarios;
}

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function FechaHoraSelector({
  especialidad,
  fechaSeleccionada,
  horaSeleccionada,
  disponibilidadKey = 0,
  onSeleccionarFecha,
  onSeleccionarHora,
}: FechaHoraSelectorProps) {
  const fechas = generarFechas(especialidad.dias);
  const duracion = especialidad.duracion ?? HORARIOS_TURNO.INTERVALO_MINUTOS;
  const horarios = generarHorarios(duracion);

  // Guardamos la respuesta junto con la clave de la consulta (fecha + bump) y
  // derivamos ocupados/cargando: así ningún setState queda sincrónico en el effect.
  const [consulta, setConsulta] = useState<{ clave: string; ocupados: string[] } | null>(null);

  useEffect(() => {
    if (!fechaSeleccionada) return;
    const clave = `${fechaSeleccionada}:${disponibilidadKey}`;
    let activo = true;
    obtenerDisponibilidadTurnos({ fecha: fechaSeleccionada })
      .then((res) => {
        if (activo) setConsulta({ clave, ocupados: res.ok ? res.data.ocupados : [] });
      })
      .catch(() => {
        if (activo) setConsulta({ clave, ocupados: [] });
      });
    return () => {
      activo = false;
    };
  }, [fechaSeleccionada, disponibilidadKey]);

  const claveActual = fechaSeleccionada ? `${fechaSeleccionada}:${disponibilidadKey}` : null;
  const ocupados = consulta && claveActual === consulta.clave ? consulta.ocupados : [];
  const cargando = Boolean(claveActual) && (!consulta || consulta.clave !== claveActual);

  const hoy = fechaLocalISO();
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Seleccioná fecha</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {fechas.map((f) => {
            const fechaObj = new Date(`${f}T00:00:00`);
            const dia = fechaObj.getDate();
            const mes = fechaObj.toLocaleDateString("es-AR", { month: "short" });
            const semana = fechaObj.toLocaleDateString("es-AR", { weekday: "short" });
            const seleccionada = fechaSeleccionada === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => onSeleccionarFecha(f)}
                aria-pressed={seleccionada}
                aria-label={formatearFecha(f)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border min-w-[76px] min-h-11 transition-all ${foco} ${
                  seleccionada
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white border-border hover:border-[#cbd5e1]"
                }`}
              >
                <span className={`text-xs font-medium ${seleccionada ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {semana} · {mes}
                </span>
                <span className={`text-lg font-bold ${seleccionada ? "text-primary-foreground" : "text-primary"}`}>
                  {dia}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {fechaSeleccionada && (
        <div>
          <h3 className="font-semibold mb-3">Seleccioná hora</h3>
          <p className="text-xs text-muted-foreground mb-2" aria-live="polite">
            {cargando
              ? "Consultando disponibilidad…"
              : ocupados.length > 0
                ? `${ocupados.length} horario(s) ocupado(s) ese día.`
                : "Horarios dentro de 09:00–17:00 según la duración de la especialidad."}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {horarios.map((h) => {
              const seleccionada = horaSeleccionada === h;
              const ocupada = ocupados.includes(h);
              const pasada = fechaSeleccionada === hoy && aMinutos(h) <= ahoraMin;
              const deshabilitada = cargando || ocupada || pasada;
              const titulo = ocupada
                ? `${h} ocupado`
                : pasada
                  ? `${h} ya pasó`
                  : cargando
                    ? "Consultando disponibilidad…"
                    : `${h} disponible`;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => !deshabilitada && onSeleccionarHora(h)}
                  disabled={deshabilitada}
                  aria-pressed={seleccionada}
                  aria-label={titulo}
                  title={titulo}
                  className={`min-h-11 px-2 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${foco} ${
                    seleccionada
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white border-border text-muted-foreground hover:border-[#cbd5e1]"
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
