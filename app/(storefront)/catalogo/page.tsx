import { createClient } from "@/core/supabase/server";
import { CatalogoExplorer } from "@/components/catalogo/catalogo-explorer";
import type { Producto } from "@/types/database.types";

export default async function CatalogoPage() {
  const supabase = await createClient();

  const { data: productos, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  const { data: categorias } = await supabase
    .from("categorias")
    .select("id, nombre")
    .order("nombre");

  if (error) {
    return (
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-6">Catálogo de productos</h1>
        <p className="text-destructive">Error al cargar los productos.</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold mb-6">Catálogo de productos</h1>
      <CatalogoExplorer
        productos={(productos ?? []) as Producto[]}
        categorias={categorias ?? []}
      />
    </main>
  );
}
