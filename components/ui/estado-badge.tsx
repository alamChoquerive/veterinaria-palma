import {
  COLOR_ESTADO_PEDIDO,
  COLOR_ESTADO_TURNO,
  ETIQUETA_ESTADO_PEDIDO,
  ETIQUETA_ESTADO_TURNO,
} from "@/lib/constants";

/**
 * Badge de estado humanizado, compartido por /cuenta y los paneles admin.
 * tipo "pedido" cubre los estados de ESTADOS_PEDIDO; "turno" los de turnos.
 */
export function EstadoBadge({
  estado,
  tipo,
}: {
  estado: string;
  tipo: "turno" | "pedido";
}) {
  const etiquetas = tipo === "turno" ? ETIQUETA_ESTADO_TURNO : ETIQUETA_ESTADO_PEDIDO;
  const colores = tipo === "turno" ? COLOR_ESTADO_TURNO : COLOR_ESTADO_PEDIDO;
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${colores[estado] ?? "bg-muted text-muted-foreground"}`}
    >
      {etiquetas[estado] ?? estado}
    </span>
  );
}
