"use client";

interface StepIndicatorProps {
  pasoActual: number;
  /** Permite volver a un paso ya completado (hacia atrás). */
  onIrPaso?: (numero: number) => void;
}

const steps = [
  { numero: 1, label: "Especialidad" },
  { numero: 2, label: "Fecha y hora" },
  { numero: 3, label: "Datos" },
  { numero: 4, label: "Confirmación" },
];

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function StepIndicator({ pasoActual, onIrPaso }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-8" aria-label="Pasos de la reserva">
      <div className="flex justify-between items-end mb-2">
        {steps.map((step) => {
          const completado = step.numero < pasoActual;
          const activo = step.numero === pasoActual;
          const navegable = completado && onIrPaso;
          const circulo = navegable ? (
            <button
              type="button"
              onClick={() => onIrPaso(step.numero)}
              aria-label={`Volver al paso ${step.numero}: ${step.label}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all ${foco}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          ) : (
            <div
              aria-current={activo ? "step" : undefined}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                completado || activo
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.numero}
            </div>
          );
          return (
            <div key={step.numero} className="flex flex-col items-center gap-1">
              {circulo}
              <span
                className={`text-xs font-medium ${activo ? "text-primary" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1" aria-hidden="true">
        {steps.map((_, i) => {
          if (i === steps.length - 1) return null;
          const completado = i + 1 < pasoActual;
          return (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${completado ? "bg-primary" : "bg-muted"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
