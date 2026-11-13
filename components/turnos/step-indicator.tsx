"use client";

interface StepIndicatorProps {
  pasoActual: number;
}

const steps = [
  { numero: 1, label: "Especialidad" },
  { numero: 2, label: "Fecha y hora" },
  { numero: 3, label: "Datos" },
  { numero: 4, label: "Confirmación" },
];

export function StepIndicator({ pasoActual }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between items-end mb-2">
        {steps.map((step, i) => {
          const completado = step.numero < pasoActual;
          const activo = step.numero === pasoActual;
          return (
            <div key={step.numero} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                completado
                  ? "bg-[#1e293b] text-white"
                  : activo
                    ? "bg-[#1e293b] text-white"
                    : "bg-[#e2e8f0] text-[#64748b]"
              }`}>
                {step.numero}
              </div>
              <span className={`text-xs font-medium ${activo ? "text-[#1e293b]" : "text-[#94a3b8]"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-1">
        {steps.map((_, i) => {
          if (i === steps.length - 1) return null;
          const completado = i + 1 < pasoActual;
          return (
            <div
              key={i}
              className={`h-1 flex-1 ${completado ? "bg-[#1e293b]" : "bg-[#e2e8f0]"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
