import { createClient } from "@/core/supabase/server";
import { ProveedoresPanel } from "@/components/admin/proveedores-panel";
import type { Proveedor } from "@/types/database.types";

export const metadata = { title: "Proveedores · Admin — Veterinaria Palma" };

export default async function AdminProveedoresPage() {
  const supabase = await createClient();

  const { data: proveedores } = await supabase
    .from("proveedores")
    .select("*")
    .order("nombre");

  return (
    <div className="space-y-6">
      <ProveedoresPanel proveedores={(proveedores ?? []) as Proveedor[]} />
    </div>
  );
}
