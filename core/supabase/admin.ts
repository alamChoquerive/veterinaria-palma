import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente ADMIN con la service_role key: bypassa RLS.
 * Usar SOLO en el servidor (webhooks de pago, tareas administrativas).
 * Si este archivo aparece en un bundle de cliente, el build falla
 * gracias al paquete "server-only".
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
