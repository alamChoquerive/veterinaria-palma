/**
 * Banner de feedback de formulario con dos variantes reales:
 * "exito" (role=status) y "error" (role=alert, tokens destructive).
 * Antes los 9 paneles admin pintaban el error con el verde de éxito.
 */
export function FormFeedback({
  tipo,
  children,
  className = "",
}: {
  tipo: "exito" | "error";
  children: React.ReactNode;
  className?: string;
}) {
  if (tipo === "error") {
    return (
      <div
        role="alert"
        className={`p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/30 ${className}`}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      role="status"
      className={`p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0] ${className}`}
    >
      {children}
    </div>
  );
}
