import { createClient } from "@/core/supabase/server";

export default async function CatalogoPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase.from("productos").select("*").eq("activo", true);

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-semibold mb-6">Catálogo de productos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(productos ?? []).map((p) => (
          <article key={p.id} className="border rounded-xl p-4">
            <h3 className="font-semibold">{p.nombre}</h3>
            <p className="text-sm text-muted-foreground">{p.descripcion ?? ""}</p>
            <p className="font-bold">{p.precio_minorista}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
