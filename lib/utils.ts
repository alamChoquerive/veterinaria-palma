import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases de Tailwind de forma segura (evita clases duplicadas/conflictivas).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda (ARS por defecto, ajuste según país).
 */
export function formatearMoneda(
  valor: number | null | undefined,
  moneda = "ARS",
) {
  if (valor === null || valor === undefined) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * Formatea una fecha ISO a "dd/MM/yyyy".
 */
export function formatearFecha(iso: string | Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Valida un email básico.
 */
export function esEmailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
