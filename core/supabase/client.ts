import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Cliente de Supabase para CLIENT COMPONENTS (navegador). Es síncrono.
 *
 * Usa la anon key pública y la sesión del usuario (cookies manejadas por
 * @supabase/ssr): todas las lecturas/escrituras pasan por RLS con los
 * permisos del usuario logueado.
 *
 * NUNCA importar "@/core/supabase/server" desde un Client Component:
 * ese archivo usa next/headers y rompe el build en el bundle de cliente.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
