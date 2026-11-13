"use client";

import type { TurnoDisponible } from "@/types/models";

export interface CalendarPickerProps {
  fechasDisponibles: TurnoDisponible[];
  onSelect: (fecha: string) => void;
  fechaSeleccionada: string | null;
}

export function CalendarPicker({
  fechasDisponibles,
  onSelect,
  fechaSeleccionada,
}: CalendarPickerProps) {
  return (
    <section className="p-4 border rounded-xl bg-background">
      <h3 className="font-semibold mb-4">Seleccioná fecha</h3>
      <div className="grid grid-cols-7 gap-1">
        {fechasDisponibles.map((dia) => {
          const seleccionada = fechaSeleccionada === dia.fecha;
          return (
            <button
              key={dia.fecha}
              disabled={!dia.disponible}
              onClick={() => dia.disponible && onSelect(dia.fecha)}
              className={`h-10 w-10 rounded-full text-sm ${
                seleccionada
                  ? "bg-primary text-primary-foreground"
                  : !dia.disponible
                    ? "text-muted-foreground opacity-50 cursor-not-allowed"
                    : "hover:bg-accent"
              }`}
            >
              {new Date(dia.fecha).getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}
