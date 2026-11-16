import { createClient } from "@/core/supabase/server";
import { TurnosPanel, type TurnoFila } from "@/components/admin/turnos-panel";
import type { Turno } from "@/types/database.types";

export const metadata = { title: "Turnos · Empleado — Veterinaria Palma" };

export default async function EmpleadoTurnosPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Turnos</h2>
        <p className="text-muted-foreground">
          Agenda de la clínica y registro de turnos presenciales.
        </p>
      </div>
      <TurnosPanel turnos={filas} />
    </div>
  );
}
