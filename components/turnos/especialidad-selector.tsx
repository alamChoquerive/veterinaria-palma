"use client";

import type { Especialidad } from "@/lib/data/especialidades";

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
      {especialidades.map((e) => {
        const seleccionada_ = seleccionada?.id === e.id;
        return (
          <button
            key={e.id}
            onClick={() => onSeleccionar(e.id)}
            className={`flex flex-col gap-3 p-4 rounded-xl border transition-all ${
              seleccionada_
                ? "bg-[#1e293b] text-white border-[#1e293b] shadow-md"
                : "bg-white border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
            }`}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center ${
              seleccionada_
                ? "bg-[#38bdf8] text-[#1e293b]"
                : "bg-[#f1f5f9] text-[#64748b]"
            }">
              {e.icono === "stethoscope" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              )}
              {e.icono === "skin" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {e.icono === "heart" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {e.icono === "tooth" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a3 3 0 003 3h8a3 3 0 003-3V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4a3 3 0 013-3h2a3 3 0 013 3v2m0 0v2a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2m0 0v-2a3 3 0 013-3h2a3 3 0 013 3V7h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 00-2 2m0 0v2a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4a3 3 0 013-3h2a3 3 0 013 3v2m0 0v2a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2m0 0v-2a3 3 0 013-3h2a3 3 0 013 3V7h-2z" />
                </svg>
              )}
              {e.icono === "bone" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              )}
              {e.icono === "eye" && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </div>
            <h3 className="font-semibold">{e.nombre}</h3>
            <p className="text-sm text-muted-foreground">{e.profesional}</p>
            <p className="text-xs text-muted-foreground">
              {e.dias.join(", ")} · {e.duracion} min
            </p>
          </button>
        );
      })}
    </div>
  );
}
