import { createClient } from "@/core/supabase/server";
import { formatearMoneda } from "@/lib/utils";

export default async function CatalogoPage() {
  const supabase = await createClient();
  const { data: productos, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(productos ?? []).map((p) => (
          <article key={p.id} className="border rounded-xl p-4 flex flex-col">
            <img
              src={p.imagen_url ?? "/placeholder.svg"}
              alt={p.nombre}
              className="w-full h-36 object-cover rounded-lg mb-3"
            />
            <h3 className="font-semibold">{p.nombre}</h3>
            <p className="text-xs text-muted-foreground mb-1">
              {p.categoria_id ?? "Sin categoría"}
            </p>
            <p className="text-sm text-muted-foreground mb-3 flex-1">
              {p.descripcion ?? ""}
            </p>
            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="font-bold">{formatearMoneda(Number(p.precio_minorista))}</span>
              <button
                disabled={p.stock === 0}
                className="px-4 py-2 bg-[#1e293b] text-white rounded text-sm font-medium hover:bg-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {p.stock === 0 ? "Sin stock" : "Agregar"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
