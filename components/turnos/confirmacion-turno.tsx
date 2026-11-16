"use client";

import Link from "next/link";

interface ConfirmacionTurnoProps {
  turno: {
    especialidad: string;
    profesional: string;
    fecha: string;
    hora: string;
    duracion: number;
    mascotaNombre: string;
    mascotaEspecie: string;
    mascotaRaza: string;
    mascotaEdad: string;
    responsableNombre: string;
    responsableTelefono: string;
    motivo: string;
  };
  onVolver: () => void;
}

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function ConfirmacionTurno({ turno, onVolver }: ConfirmacionTurnoProps) {
  return (
    <div className="max-w-md mx-auto text-center py-10">
      {/* emerald-700 sobre emerald-600/10: contraste suficiente (antes #10b981 sobre /10) */}
      <div className="w-16 h-16 rounded-full bg-emerald-600/10 flex items-center justify-center mx-auto mb-6 text-emerald-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      {/* El turno queda en estado 'pendiente' hasta que el staff lo confirma:
          el copy no puede decir "confirmado" */}
      <h2 className="text-2xl font-bold mb-2">Turno pendiente de confirmación</h2>
      <p className="text-muted-foreground mb-8">
        Recibimos tu solicitud. Te vamos a confirmar por teléfono durante el
        horario de atención (lun a vie, 9:00 a 17:00).
      </p>

      <div className="bg-background border border-border rounded-xl p-6 mb-8 text-left">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Especialidad</span>
            <span className="font-medium text-right">{turno.especialidad}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Veterinario</span>
            <span className="font-medium text-right">{turno.profesional}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium text-right">{turno.fecha}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Hora</span>
            <span className="font-medium text-right">{turno.hora}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Duración</span>
            <span className="font-medium text-right">{turno.duracion} min</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Mascota</span>
            <span className="font-medium text-right">{turno.mascotaNombre}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Responsable</span>
            <span className="font-medium text-right">{turno.responsableNombre}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-8">
        Si necesitás cambiar o cancelar el turno, llamanos al{" "}
        <a href="tel:+542615551234" className={`underline font-medium ${foco}`}>
          +54 261 555-1234
        </a>
        .
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className={`px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors ${foco}`}
        >
          Volver al inicio
        </Link>
        <button
          type="button"
          onClick={onVolver}
          className={`px-8 py-3 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors ${foco}`}
        >
          Reservar otro turno
        </button>
      </div>
    </div>
  );
}
