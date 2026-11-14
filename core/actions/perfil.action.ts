"use server";

import { getPerfilActual } from "@/core/services/auth.service";
import type { ActionResult } from "@/types/api";

/**
 * Obtiene el perfil del usuario autenticado.
 */
export async function obtenerPerfilAction(): Promise<ActionResult> {
  const { perfil, error } = await getPerfilActual();

  if (error || !perfil) {
    if (error && error !== "Usuario no autenticado") {
      console.error("[obtenerPerfilAction] Error:", error);
    }
    return { ok: false, error: "No se pudo obtener el perfil" };
  }

  return { ok: true, data: perfil };
}
