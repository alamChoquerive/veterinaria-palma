/**
 * Formatos de respuesta esperados de las Server Actions (core/actions/*).
 * Las actions siempre devuelven { ok: true, data } o { ok: false, error }.
 */
export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ActionError = {
  field?: string;
  message: string;
};

export type CreateTurnoInput = {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo?: string;
};

export type ActualizarStockInput = {
  productoId: string;
  cantidad: number; // positivo para sumar, negativo para restar
};
