import { createClient } from "@/core/supabase/server";
import { PagosEnviosPanel } from "@/components/admin/pagos-envios-panel";
import type { MedioPago, ZonaEnvio } from "@/types/database.types";

export const metadata = { title: "Pagos y envíos · Admin — Veterinaria Palma" };

export default async function AdminPagosEnviosPage() {
  const supabase = await createClient();

  // El admin ve todos (activos e inactivos): policy "admin lectura"
  const [medios, zonas] = await Promise.all([
    supabase.from("medios_pago").select("*").order("nombre"),
    supabase.from("zonas_envio").select("*").order("nombre"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Pagos y envíos</h2>
        <p className="text-muted-foreground">Medios de pago habilitados y opciones de envío.</p>
      </div>
      <PagosEnviosPanel
        medios={(medios.data ?? []) as MedioPago[]}
        zonas={(zonas.data ?? []) as ZonaEnvio[]}
      />
    </div>
  );
}
