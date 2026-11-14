import { createClient } from "@/core/supabase/server";
import {
  CatalogoTable,
  type ProductoCatalogoFila,
  type CategoriaFila,
} from "@/components/admin/catalogo-table";
import type { Producto } from "@/types/database.types";

export default async function AdminCatalogoPage() {
  const supabase = await createClient();

  const [productos, categorias] = await Promise.all([
    supabase.from("productos").select("*").order("nombre"),
    supabase.from("categorias").select("id, nombre").order("nombre"),
  ]);

  const cats = (categorias.data ?? []) as CategoriaFila[];
  const filas: ProductoCatalogoFila[] = (productos.data ?? []).map((p) => ({
    ...(p as Producto),
    categoria: cats.find((c) => c.id === p.categoria_id)?.nombre ?? null,
    categoria_id: p.categoria_id,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Catálogo</h2>
        <p className="text-[#64748b]">Editá los productos cargados en el inventario.</p>
      </div>
      <CatalogoTable productos={filas} categorias={cats} />
    </div>
  );
}
