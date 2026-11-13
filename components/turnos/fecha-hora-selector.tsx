"use client";

import type { Especialidad } from "@/lib/data/especialidades";

interface FechaHoraSelectorProps {
  especialidad: Especialidad;
  fechaSeleccionada: string | null;
  horaSeleccionada: string | null;
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

function generarFechas(dias: string[]): string[] {
  const fechas: string[] = [];
  const hoy = new Date();
  for (let i = 0; i < 30; i++) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() + i);
    const diaNum = fecha.getDay();
    if (dias.some((d) => DIAS_NUM[d] === diaNum)) {
      fechas.push(fecha.toISOString().split("T")[0]);
    }
  }
  return fechas.slice(0, 8);
}

function generarHorarios(): string[] {
  const horarios: string[] = [];
  for (let h = 9; h < 17; h++) {
    horarios.push(`${h.toString().padStart(2, "0")}:00`);
    horarios.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return horarios;
}

export function FechaHoraSelector({
  especialidad,
  fechaSeleccionada,
  horaSeleccionada,
  onSeleccionarFecha,
  onSeleccionarHora,
}: FechaHoraSelectorProps) {
  const fechas = generarFechas(especialidad.dias);
  const horarios = generarHorarios();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Seleccioná fecha</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {fechas.map((f) => {
            const fechaObj = new Date(f + "T00:00:00");
            const dia = fechaObj.getDate();
            const mes = fechaObj.toLocaleDateString("es-AR", { month: "short" });
            const seleccionada = fechaSeleccionada === f;
            return (
              <button
                key={f}
                onClick={() => onSeleccionarFecha(f)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border min-w-[70px] transition-all ${
                  seleccionada
                    ? "bg-[#1e293b] text-white border-[#1e293b]"
                    : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1]"
                }`}
              >
                <span className="text-xs font-medium">{mes}</span>
                <span className={`text-lg font-bold ${seleccionada ? "text-white" : "text-[#1e293b]"}`}>
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
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {horarios.map((h) => {
              const seleccionada = horaSeleccionada === h;
              return (
                <button
                  key={h}
                  onClick={() => onSeleccionarHora(h)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    seleccionada
                      ? "bg-[#1e293b] text-white border-[#1e293b]"
                      : "bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
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
