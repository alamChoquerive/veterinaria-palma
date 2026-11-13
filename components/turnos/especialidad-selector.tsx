"use client";

import type { Especialidad } from "@/lib/data/especialidades";

interface EspecialidadSelectorProps {
  especialidades: Especialidad[];
  seleccionada: Especialidad | null;
  onSeleccionar: (id: string) => void;
}

const ICONOS: Record<string, string> = {
  stethoscope: "🩺",
  skin: "🧴",
  heart: "❤️",
  tooth: "🦷",
  bone: "🦴",
  eye: "👁️",
};

export function EspecialidadSelector({
  especialidades,
  seleccionada,
  onSeleccionar,
}: EspecialidadSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {especialidades.map((e) => {
        const seleccionada_ = seleccionada?.id === e.id;
        return (
          <button
            key={e.id}
            onClick={() => onSeleccionar(e.id)}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
              seleccionada_
                ? "bg-[#1e293b] text-white border-[#1e293b] shadow-md"
                : "bg-white border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
            }`}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${
              seleccionada_
                ? "bg-[#38bdf8] text-[#1e293b]"
                : "bg-[#f1f5f9] text-[#64748b]"
            }">
              {ICONOS[e.icono] ?? "🏥"}
            </div>
            <h3 className="font-semibold text-center">{e.nombre}</h3>
            <p className="text-xs text-muted-foreground text-center leading-tight">
              {e.profesional}
            </p>
            <p className="text-xs text-muted-foreground text-center">
              {e.dias.join(", ")} · {e.duracion} min
            </p>
          </button>
        );
      })}
    </div>
  );
}
