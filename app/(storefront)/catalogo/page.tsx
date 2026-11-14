import { createClient } from "@/core/supabase/server";
import { ProductoCard } from "@/components/catalogo/producto-card";
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
    .select("id, nombre");

  if (error) {
    return (
      <main className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-6">Catálogo de productos</h1>
        <p className="text-destructive">Error al cargar los productos.</p>
      </main>
    );
  }

  const nombreCategoria = (categoriaId: string | null) =>
    categorias?.find((c) => c.id === categoriaId)?.nombre ?? null;

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold mb-6">Catálogo de productos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(productos ?? []).map((p) => (
          <ProductoCard
            key={p.id}
            producto={p as Producto}
            categoria={nombreCategoria(p.categoria_id)}
          />
        ))}
      </div>
    </main>
  );
}
