import { createClient } from "@/core/supabase/server";
import {
  CatalogoEmpleadoTable,
  type ProductoEmpleadoFila,
} from "@/components/empleado/catalogo-empleado-table";
import type { Producto } from "@/types/database.types";

export const metadata = { title: "Catálogo · Empleado — Veterinaria Palma" };

export default async function EmpleadoCatalogoPage() {
  const supabase = await createClient();

  const [productos, categorias] = await Promise.all([
    supabase.from("productos").select("*").order("nombre"),
    supabase.from("categorias").select("id, nombre").order("nombre"),
  ]);

  const cats = categorias.data ?? [];
  const filas: ProductoEmpleadoFila[] = (productos.data ?? []).map((p) => ({
    ...(p as Producto),
    categoria: cats.find((c) => c.id === p.categoria_id)?.nombre ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Catálogo</h2>
        <p className="text-muted-foreground">Solo podés editar el nombre y la foto del producto.</p>
      </div>
      <CatalogoEmpleadoTable productos={filas} />
    </div>
  );
}
