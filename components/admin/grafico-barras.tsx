/**
 * Gráficos de barras horizontales en CSS puro (sin librerías de charts),
 * compartidos por las estadísticas de turnos y la sección de ventas.
 */

export function FilaBarra({
  etiqueta,
  valor,
  max,
  color,
  sufijo = "",
}: {
  etiqueta: string;
  valor: number;
  max: number;
  color: string;
  sufijo?: string;
}) {
  const porcentaje = max > 0 ? Math.max((valor / max) * 100, valor > 0 ? 5 : 0) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 shrink-0 text-xs text-[#64748b] truncate" title={etiqueta}>
        {etiqueta}
      </span>
      <div className="flex-1 h-5 bg-[#f1f5f9] rounded-md overflow-hidden">
        <div
          className="h-full rounded-md transition-all"
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-16 shrink-0 text-right text-xs font-bold text-[#1e293b]">
        {valor}
        {sufijo}
      </span>
    </div>
  );
}

export function PanelGrafico({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <h3 className="font-semibold text-[#1e293b] mb-4">{titulo}</h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
