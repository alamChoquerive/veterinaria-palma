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

export function ConfirmacionTurno({ turno, onVolver }: ConfirmacionTurnoProps) {
  return (
    <div className="max-w-md mx-auto text-center py-10">
      <div className="w-16 h-16 rounded-full bg-[#10b981]/10 flex items-center justify-center mx-auto mb-6 text-[#10b981]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">Turno reservado</h2>
      <p className="text-muted-foreground mb-8">
        Tu turno ha sido confirmado con éxito.
      </p>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-8 text-left">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#64748b]">Especialidad</span>
            <span className="font-medium">{turno.especialidad}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Veterinario</span>
            <span className="font-medium">{turno.profesional}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Fecha</span>
            <span className="font-medium">{turno.fecha}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Hora</span>
            <span className="font-medium">{turno.hora}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Duración</span>
            <span className="font-medium">{turno.duracion} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Mascota</span>
            <span className="font-medium">{turno.mascotaNombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748b]">Responsable</span>
            <span className="font-medium">{turno.responsableNombre}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-[#64748b] mb-8">
        Te enviaremos un recordatorio antes de tu turno.
      </p>

      <button
        onClick={onVolver}
        className="px-8 py-3 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors"
      >
        Volver al inicio
      </button>
    </div>
  );
}
