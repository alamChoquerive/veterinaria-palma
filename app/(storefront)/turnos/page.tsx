import { createClient } from "@/core/supabase/server";

export default async function TurnosPage() {
  const supabase = await createClient();
  const { data: turnos } = await supabase
    .from("turnos")
    .select("*")
    .order("fecha", { ascending: true });

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold mb-6">Mis turnos</h1>
      <ul className="space-y-3">
        {(turnos ?? []).map((t) => (
          <li key={t.id} className="border p-4 rounded-lg">
            <p>{t.fecha} — {t.hora_inicio} a {t.hora_fin}</p>
            <p className="text-sm text-muted-foreground">{t.estado}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
