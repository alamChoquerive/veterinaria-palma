"use client";

import { useEffect } from "react";

/**
 * Modal compartido del panel: role=dialog + aria-modal, se cierra con Esc
 * o clic en el backdrop, y bloquea el scroll del body mientras está abierto.
 * Antes cada modal del admin era un div fijo sin accesibilidad ni dismiss.
 */
export function Modal({
  titulo,
  descripcion,
  onCerrar,
  children,
  ancho = "max-w-md",
}: {
  titulo: string;
  descripcion?: string;
  onCerrar: () => void;
  children: React.ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    function alTecla(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", alTecla);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTecla);
      document.body.style.overflow = anterior;
    };
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`bg-card rounded-xl border border-border shadow-lg w-full ${ancho} p-6 max-h-[90vh] overflow-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-primary mb-1">{titulo}</h3>
        {descripcion && <p className="text-sm text-muted-foreground mb-4">{descripcion}</p>}
        {children}
      </div>
    </div>
  );
}
