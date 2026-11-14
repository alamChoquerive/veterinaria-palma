import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/core/supabase/admin";

/**
 * Rate limiting con ventana deslizante almacenada en Postgres
 * (tabla rate_limit_eventos + RPC verificar_rate_limit, migración 0006).
 *
 * En serverless un Map en memoria no sirve: cada instancia es efímera
 * y no comparten estado. Postgres sí es un store compartido entre todas
 * las instancias del deploy.
 */

/** IP del cliente: detrás del proxy de la plataforma llega en x-forwarded-for. */
export async function ipDelCliente(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  const ip = xff?.split(",")[0]?.trim();
  return ip || "desconocido";
}

/**
 * Devuelve true si la clave todavía está dentro del límite
 * (maxIntentos cada ventanaSegundos); false si hay que rechazar.
 *
 * Fail-open: si la RPC falla (p. ej. todavía no corriste la migración
 * 0006 en Supabase), se loguea el error y se deja pasar. El rate limit es
 * defensa en profundidad; el boundary real de autenticación es Supabase
 * Auth, que ya aplica sus propios límites por IP.
 */
export async function verificarRateLimit(
  clave: string,
  maxIntentos: number,
  ventanaSegundos: number,
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("verificar_rate_limit", {
      p_clave: clave,
      p_max: maxIntentos,
      p_ventana: `${ventanaSegundos} seconds`,
    });
    if (error) {
      console.error(
        "[rate-limit] Error en la RPC verificar_rate_limit:",
        error.message,
      );
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("[rate-limit] Excepción inesperada:", e);
    return true;
  }
}
