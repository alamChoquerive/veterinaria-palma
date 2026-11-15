import { createAdminClient } from "@/core/supabase/admin";

/**
 * Registra un intento de login en public.logs_acceso.
 *
 * Solo se escribe con service_role (la tabla no tiene policy de INSERT),
 * así que un atacante no puede inundarla ni leerla desde la app.
 * Nunca debe romper el flujo de login: si falla, solo se loguea.
 */
export async function registrarIntentoLogin(params: {
  email: string;
  exito: boolean;
  perfilId?: string | null;
  ip?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("logs_acceso").insert({
      email: params.email.trim().slice(0, 200),
      exito: params.exito,
      perfil_id: params.perfilId ?? null,
      ip: params.ip ?? null,
    });
    if (error) {
      console.error("[logAcceso] Error al registrar intento:", error.message);
    }
  } catch (e) {
    console.error("[logAcceso] Excepción al registrar intento:", e);
  }
}
