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
  // OJO off-by-one: un string "AAAA-MM-DD" parsea como UTC y en UTC-3 puede
  // mostrar el día anterior. Si es solo fecha, la parseamos como local.
  const fecha =
    typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)
      ? new Date(`${iso}T00:00:00`)
      : new Date(iso);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

/** Devuelve "AAAA-MM-DD" en horario LOCAL (sin pasar por UTC). */
export function fechaLocalISO(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Valida un email básico.
 */
export function esEmailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
