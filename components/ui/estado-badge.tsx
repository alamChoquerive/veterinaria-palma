import {
  COLOR_ESTADO_PEDIDO,
  COLOR_ESTADO_TURNO,
  COLOR_ESTADO_VENTA,
  ETIQUETA_ESTADO_PEDIDO,
  ETIQUETA_ESTADO_TURNO,
  ETIQUETA_ESTADO_VENTA,
} from "@/lib/constants";

/**
 * Badge de estado humanizado, compartido por /cuenta y los paneles.
 * tipo "pedido" cubre ESTADOS_PEDIDO, "turno" los de turnos y "venta"
 * los de las ventas presenciales del POS.
 */
export function EstadoBadge({
  estado,
  tipo,
}: {
  estado: string;
  tipo: "turno" | "pedido" | "venta";
}) {
  const etiquetas =
    tipo === "turno"
      ? ETIQUETA_ESTADO_TURNO
      : tipo === "venta"
        ? ETIQUETA_ESTADO_VENTA
        : ETIQUETA_ESTADO_PEDIDO;
  const colores =
    tipo === "turno"
      ? COLOR_ESTADO_TURNO
      : tipo === "venta"
        ? COLOR_ESTADO_VENTA
        : COLOR_ESTADO_PEDIDO;
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${colores[estado] ?? "bg-muted text-muted-foreground"}`}
    >
      {etiquetas[estado] ?? estado}
    </span>
  );
}
