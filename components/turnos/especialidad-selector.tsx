"use client";

import type { Especialidad } from "@/lib/data/especialidades";
import { EspecialidadCard } from "@/components/turnos/especialidad-card";

interface EspecialidadSelectorProps {
  especialidades: Especialidad[];
  seleccionada: Especialidad | null;
  onSeleccionar: (id: string) => void;
}

export function EspecialidadSelector({
  especialidades,
  seleccionada,
  onSeleccionar,
}: EspecialidadSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {especialidades.map((e) => (
        <EspecialidadCard
          key={e.id}
          especialidad={e}
          seleccionada={seleccionada?.id === e.id}
          onSeleccionar={() => onSeleccionar(e.id)}
        />
      ))}
    </div>
  );
}
