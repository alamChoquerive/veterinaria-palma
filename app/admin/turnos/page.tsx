import { createClient } from "@/core/supabase/server";
import { TurnosPanel, type TurnoFila } from "@/components/admin/turnos-panel";
import type { Turno } from "@/types/database.types";

export default async function AdminTurnosPage() {
  const supabase = await createClient();

  const { data: turnos } = await supabase
    .from("turnos")
    .select("*")
    .order("fecha", { ascending: false })
    .order("hora_inicio", { ascending: true });

  const { data: perfiles } = await supabase
    .from("perfiles")
    .select("id, nombre, apellido, email");

  const filas: TurnoFila[] = (turnos ?? []).map((t) => ({
    ...(t as Turno),
    perfiles: perfiles?.find((p) => p.id === t.perfil_id) ?? null,
  }));

  return <TurnosPanel turnos={filas} />;
}
