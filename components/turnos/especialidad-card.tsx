"use client";

import type { Especialidad } from "@/lib/data/especialidades";

const ICONOS: Record<string, string> = {
  stethoscope: "🩺",
  skin: "🧴",
  heart: "❤️",
  tooth: "🦷",
  bone: "🦴",
  eye: "👁️",
};

interface EspecialidadCardProps {
  especialidad: Especialidad;
  seleccionada: boolean;
  onSeleccionar: () => void;
}

export function EspecialidadCard({ especialidad, seleccionada, onSeleccionar }: EspecialidadCardProps) {
  const claseContenedor = seleccionada
    ? "bg-[#1e293b] text-white border-[#1e293b] shadow-md"
    : "bg-white border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1]";

  const claseIcono = seleccionada
    ? "bg-[#38bdf8] text-[#1e293b]"
    : "bg-[#f1f5f9] text-[#64748b]";

  return (
    <button
      onClick={onSeleccionar}
      className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${claseContenedor}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${claseIcono}`}>
        {ICONOS[especialidad.icono] ?? "🏥"}
      </div>
      <h3 className="font-semibold text-center">{especialidad.nombre}</h3>
      <p className="text-xs text-muted-foreground text-center leading-tight">
        {especialidad.profesional}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        {especialidad.dias.join(", ")} · {especialidad.duracion} min
      </p>
    </button>
  );
}
