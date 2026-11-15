"use client";

import { useMemo, useState } from "react";
import type { Categoria, Producto } from "@/types/database.types";

type CategoriaCorta = Pick<Categoria, "id" | "nombre">;
import { Input } from "@/components/ui/input";
import { ProductoCard } from "@/components/catalogo/producto-card";

const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const chipBase = `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${foco}`;
const chipOn = "bg-[#1e293b] text-white border-[#1e293b]";
const chipOff =
  "bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f1f5f9] hover:text-[#1e293b]";

/**
 * Buscador + filtros por categoría del catálogo (lado cliente; los datos los
 * trae el server component de /catalogo). En mobile los chips hacen wrap y
 * como máximo se ven 4 categorías + "Todas"; el resto queda en el select.
 */
export function CatalogoExplorer({
  productos,
  categorias,
}: {
  productos: Producto[];
  categorias: CategoriaCorta[];
}) {
  const [query, setQuery] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  const nombreCategoria = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categorias) map.set(c.id, c.nombre);
    return map;
  }, [categorias]);

  const visibles = categorias.slice(0, 4);
  const restantes = categorias.slice(4);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      if (categoriaId && p.categoria_id !== categoriaId) return false;
      if (!q) return true;
      const nombre = (p.nombre ?? "").toLowerCase();
      const desc = (p.descripcion ?? "").toLowerCase();
      return nombre.includes(q) || desc.includes(q);
    });
  }, [productos, query, categoriaId]);

  function limpiarFiltros() {
    setQuery("");
    setCategoriaId(null);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="catalogo-buscar" className="sr-only">
            Buscar productos
          </label>
          <Input
            id="catalogo-buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción…"
            autoComplete="off"
          />
        </div>
        <p className="text-sm text-muted-foreground sm:text-right" aria-live="polite">
          {filtrados.length} producto{filtrados.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6" role="group" aria-label="Filtrar por categoría">
        <button
          type="button"
          aria-pressed={categoriaId === null}
          onClick={() => setCategoriaId(null)}
          className={`${chipBase} ${categoriaId === null ? chipOn : chipOff}`}
        >
          Todas
        </button>
        {visibles.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={categoriaId === c.id}
            onClick={() => setCategoriaId(c.id)}
            className={`${chipBase} ${categoriaId === c.id ? chipOn : chipOff}`}
          >
            {c.nombre}
          </button>
        ))}
        {restantes.length > 0 && (
          <select
            aria-label="Más categorías"
            value={restantes.some((c) => c.id === categoriaId) ? categoriaId ?? "" : ""}
            onChange={(e) => setCategoriaId(e.target.value || null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f1f5f9] ${foco}`}
          >
            <option value="">Más categorías…</option>
            {restantes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-16 border rounded-xl">
          <p className="text-muted-foreground mb-4">
            No hay productos que coincidan con la búsqueda.
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className={`px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors ${foco}`}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((p) => (
            <ProductoCard
              key={p.id}
              producto={p}
              categoria={p.categoria_id ? nombreCategoria.get(p.categoria_id) ?? null : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
