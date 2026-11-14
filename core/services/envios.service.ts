import type { ZonaEnvio } from "@/types/database.types";

/**
 * Lógica de costos de envío: el método de entrega del checkout
 * ('retiro_tienda' | 'envio_local' | 'envio_provincial') se mapea a la zona
 * activa de `zonas_envio` por su columna metodo_entrega.
 *
 * NOTA: esto solo calcula la ESTIMACIÓN que se muestra en pantalla.
 * El costo real lo calcula el servidor (RPC crear_pedido).
 */
export function calcularCostoEnvio({
  metodo,
  zonas,
}: {
  metodo: string;
  zonas: ZonaEnvio[];
}) {
  if (metodo === "retiro_tienda") {
    return { costo: 0, zona: null, metodoEntrega: metodo };
  }

  const zona = zonas.find((z) => z.activo && z.metodo_entrega === metodo);

  if (!zona) {
    return { costo: 0, zona: null, metodoEntrega: metodo };
  }

  return {
    costo: Number(zona.costo),
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
