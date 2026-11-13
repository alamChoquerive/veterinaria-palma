import type { ZonaEnvio } from "@/types/database.types";

/**
 * Lógica de costos de envío: local vs provincial.
 */
export function calcularCostoEnvio({
  metodo,
  zonas,
}: {
  metodo: string;
  zonas: ZonaEnvio[];
}) {
  const zona = zonas.find((z) => z.id === metodo || z.nombre === metodo);

  if (!zona) {
    return { costo: 0, zona: null, metodoEntrega: metodo };
  }

  return {
    costo: zona.costo,
    zona,
    metodoEntrega: metodo,
  };
}

/**
 * Devuelve true si el método de envío requiere dirección de entrega.
 */
export function requiereDireccionEnvio(metodo: string) {
  return metodo !== "retiro_tienda";
}
