"use client";

import { useEffect } from "react";
import { useCart } from "@/components/carrito/cart-context";

/**
 * Vacía el carrito al montarse. Se usa en /checkout/exito: esa página solo
 * se alcanza cuando Mercado Pago devuelve al comprador con el pago aprobado
 * (auto_return = "approved"), así que la compra ya está hecha y el carrito
 * debe quedar vacío.
 */
export function VaciarCarrito() {
  const { limpiar } = useCart();
  useEffect(() => {
    limpiar();
  }, [limpiar]);
  return null;
}
