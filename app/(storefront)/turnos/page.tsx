"use client";

import { TurnFlow } from "@/components/turnos/turn-flow";

export default function TurnosPage() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Reservar turno</h1>
      <p className="text-muted-foreground mb-8">
        Seleccioná la especialidad, fecha y hora para tu consulta veterinaria.
      </p>
      <TurnFlow />
    </main>
  );
}
