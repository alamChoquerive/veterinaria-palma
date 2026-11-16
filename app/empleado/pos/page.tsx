import { createClient } from "@/core/supabase/server";
import {
  PosPanel,
  type ProductoPos,
  type VentaDelDia,
} from "@/components/empleado/pos-panel";
import type { Venta, MedioPago } from "@/types/database.types";
import { METODOS_PAGO_POS } from "@/lib/constants";

export const metadata = { title: "Venta presencial (POS) · Empleado — Veterinaria Palma" };

export default async function EmpleadoPosPage() {
  const supabase = await createClient();

  const [productos, medios, ventas, perfiles] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, precio_minorista, stock, imagen_url, activo")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("medios_pago")
      .select("clave, nombre, activo")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("ventas")
      .select("*")
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("perfiles").select("id, nombre, apellido, email"),
  ]);

  // Solo efectivo y mercadopago aplican al POS (lista centralizada en constants)
  const mediosPos = (medios.data ?? []).filter((m) =>
    (METODOS_PAGO_POS as readonly string[]).includes(m.clave),
  ) as MedioPago[];

  const mapaPerfiles = new Map((perfiles.data ?? []).map((p) => [p.id, p]));
  const filasVentas: VentaDelDia[] = (ventas.data ?? []).map((v) => ({
    ...(v as Venta),
    vendedor:
      mapaPerfiles.get(v.perfil_id)?.nombre ??
      mapaPerfiles.get(v.perfil_id)?.email ??
      "—",
  }));

  return (
    <PosPanel
      productos={(productos.data ?? []) as ProductoPos[]}
      medios={mediosPos}
      ventasHoy={filasVentas}
    />
  );
}
