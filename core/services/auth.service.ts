import { createClient } from "@/core/supabase/server";
import type { Perfil } from "@/types/database.types";

/**
 * Obtiene el perfil del usuario autenticado.
 */
export async function getPerfilActual(): Promise<{
  perfil: Perfil | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { perfil: null, error: "Usuario no autenticado" };
  }

  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { perfil: null, error: error.message };
  }

  return { perfil: perfil as Perfil, error: null };
}

/**
 * Verifica si el usuario autenticado tiene el rol requerido.
 */
export async function verificarRol(rolRequerido: string): Promise<{
  autorizado: boolean;
  error: string | null;
}> {
  const { perfil, error } = await getPerfilActual();

  if (error || !perfil) {
    return { autorizado: false, error: error ?? "Usuario no autenticado" };
  }

  if (perfil.rol !== rolRequerido) {
    return {
      autorizado: false,
      error: "No tenés permisos para acceder a esta sección",
    };
  }

  return { autorizado: true, error: null };
}
