import type { Role } from "@/types/database.types";

/**
 * Lógica de precios y segmentación de clientes.
 * Vive fuera de la UI para que la regla de negocio sea inmutable y testeable.
 *
 * Recibe el precio minorista, el precio mayorista y el rol del usuario,
 * y devuelve el precio final que debe verse.
 */
export function calcularPrecioFinal({
  precioMinorista,
  precioMayorista,
  rol,
}: {
  precioMinorista: number;
  precioMayorista: number;
  rol: Role;
}) {
  if (rol === "mayorista") {
    return {
      precio: precioMayorista,
      esMayorista: true,
      mensaje: "Precio mayorista aplicado",
    };
  }

  return {
    precio: precioMinorista,
    esMayorista: false,
    mensaje: "Precio minorista aplicado",
  };
}

/**
 * Devuelve el descuento porcentual aplicado (0 si es minorista).
 */
export function descuentoMayorista({
  precioMinorista,
  precioMayorista,
}: {
  precioMinorista: number;
  precioMayorista: number;
}) {
  if (precioMinorista <= 0) return 0;
  return ((precioMinorista - precioMayorista) / precioMinorista) * 100;
}
