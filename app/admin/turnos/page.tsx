import { createClient } from "@/core/supabase/server";
import { AgendaTable, type TurnoFila } from "@/components/admin/agenda-table";

export default async function AdminAgendaPage() {
  const supabase = await createClient();

  const { data: turnos } = await supabase
    .from("turnos")
    .select("*")
    .order("fecha", { ascending: true });

  const { data: perfiles } = await supabase
    .from("perfiles")
    .select("id, nombre, apellido, email");

  const filas: TurnoFila[] = (turnos ?? []).map((t) => ({
    ...t,
    perfiles: perfiles?.find((p) => p.id === t.perfil_id) ?? null,
  }));

  return <AgendaTable turnos={filas} />;
}
