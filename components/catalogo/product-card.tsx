"use client";

import type { ProductoPublico } from "@/types/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatearMoneda } from "@/lib/utils";

export interface ProductCardProps {
  producto: ProductoPublico;
  onAgregar: (id: string) => void;
}

export function ProductCard({ producto, onAgregar }: ProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{producto.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{producto.descripcion}</p>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{formatearMoneda(producto.precio)}</span>
          <span className="text-xs font-medium">
            {producto.stock > 0 ? "En stock" : "Sin stock"}
          </span>
        </div>
        <Button
          disabled={producto.stock === 0}
          onClick={() => onAgregar(producto.id)}
        >
          Agregar
        </Button>
      </CardContent>
    </Card>
  );
}
