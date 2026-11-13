"use server";

import { getPerfilActual } from "@/core/services/auth.service";
import type { ActionResult } from "@/types/api";

/**
 * Obtiene el perfil del usuario autenticado.
 */
export async function obtenerPerfilAction(): Promise<ActionResult> {
  const { perfil, error } = await getPerfilActual();

  if (error || !perfil) {
    return { ok: false, error: error ?? "Usuario no autenticado" };
  }

  return { ok: true, data: perfil };
}
