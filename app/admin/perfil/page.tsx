import { createClient } from "@/core/supabase/server";
import { getPerfilActual } from "@/core/services/auth.service";
import { PerfilAjustesPanel } from "@/components/admin/perfil-ajustes-panel";
import type { Perfil } from "@/types/database.types";

export const metadata = { title: "Perfil y ajustes · Admin — Veterinaria Palma" };

export default async function AdminPerfilPage() {
  const supabase = await createClient();
  const { perfil } = await getPerfilActual();

  const [config, perfiles] = await Promise.all([
    supabase.from("config_tienda").select("clave, valor"),
    supabase
      .from("perfiles")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const configMapa = new Map((config.data ?? []).map((c) => [c.clave, c.valor]));

  return (
    <PerfilAjustesPanel
      perfilActual={(perfil ?? null) as Perfil | null}
      config={Object.fromEntries(configMapa)}
      usuarios={(perfiles.data ?? []) as Perfil[]}
    />
  );
}
