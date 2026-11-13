import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para SERVER COMPONENTS, SERVER ACTIONS y ROUTE HANDLERS.
 * La sesión se lee/escribe en las cookies de Next (en Next 16 cookies() es async).
 *
 * IMPORTANTE: nunca importar este archivo desde un Client Component.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: se ignora.
            // El proxy.ts / las Server Actions refrescan la sesión.
          }
        },
      },
    },
  );
}
