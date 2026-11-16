import { createClient } from "@/core/supabase/server";
import { PreciosPanel, type ProductoPrecioFila } from "@/components/admin/precios-panel";
import type { Producto } from "@/types/database.types";

export const metadata = { title: "Precios · Admin — Veterinaria Palma" };

export default async function AdminPreciosPage() {
  const supabase = await createClient();

  const [productos, config] = await Promise.all([
    supabase.from("productos").select("*").order("nombre"),
    supabase.from("config_tienda").select("clave, valor"),
  ]);

  const filas: ProductoPrecioFila[] = (productos.data ?? []).map((p) => (p as Producto));

  const margenMinorista = Number(
    config.data?.find((c) => c.clave === "margen_minorista_pct")?.valor ?? "30",
  );
  const margenMayorista = Number(
    config.data?.find((c) => c.clave === "margen_mayorista_pct")?.valor ?? "15",
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Precios</h2>
        <p className="text-muted-foreground">Márgenes globales sobre el costo y precios individuales.</p>
      </div>
      <PreciosPanel
        productos={filas}
        margenMinoristaInicial={margenMinorista}
        margenMayoristaInicial={margenMayorista}
      />
    </div>
  );
}
