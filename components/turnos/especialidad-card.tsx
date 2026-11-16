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

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function EspecialidadCard({ especialidad, seleccionada, onSeleccionar }: EspecialidadCardProps) {
  // En seleccionada el fondo es bg-primary (slate-800): los textos secundarios
  // usan primary-foreground con opacidad, no text-muted-foreground (que sobre
  // oscuro daba ~3:1 y fallaba contraste AA).
  const claseContenedor = seleccionada
    ? "bg-primary text-primary-foreground border-primary shadow-md"
    : "bg-background text-foreground border-border hover:bg-muted/50 hover:border-[#cbd5e1]";

  const claseIcono = seleccionada
    ? "bg-primary-foreground/15 text-primary-foreground"
    : "bg-muted text-muted-foreground";

  const claseSecundario = seleccionada
    ? "text-primary-foreground/80"
    : "text-muted-foreground";

  return (
    <button
      type="button"
      onClick={onSeleccionar}
      aria-pressed={seleccionada}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-left transition-all ${claseContenedor} ${foco}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl self-start ${claseIcono}`}>
        <span aria-hidden="true">{ICONOS[especialidad.icono] ?? "🏥"}</span>
      </div>
      <h3 className="font-semibold text-center w-full">{especialidad.nombre}</h3>
      <p className={`text-xs text-center leading-snug ${claseSecundario}`}>
        {especialidad.descripcion}
      </p>
      <p className={`text-xs text-center ${claseSecundario}`}>
        {especialidad.profesional} · {especialidad.dias.join(", ")} · {especialidad.duracion} min
      </p>
    </button>
  );
}
