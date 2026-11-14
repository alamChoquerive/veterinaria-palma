import { createClient } from "@/core/supabase/server";
import {
  InventarioTable,
  type ProductoFila,
} from "@/components/admin/inventario-table";
import type { Producto } from "@/types/database.types";

export default async function AdminInventarioPage() {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("nombre");

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre");

  const filas: ProductoFila[] = (productos ?? []).map((p) => ({
    ...(p as Producto),
    categoria:
      categorias?.find((c) => c.id === p.categoria_id)?.nombre ?? null,
  }));

  return <InventarioTable productos={filas} />;
}
