"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Producto } from "@/types/database.types";

interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface CartContextType {
  items: CartItem[];
  agregar: (producto: Producto) => void;
  aumentar: (id: string) => void;
  disminuir: (id: string) => void;
  eliminar: (id: string) => void;
  total: number;
  cantidadTotal: number;
  limpiar: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const total = items.reduce(
    (sum, item) => sum + Number(item.producto.precio_minorista) * item.cantidad,
    0
  );
  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);

  const agregar = useCallback((producto: Producto) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }, []);

  const aumentar = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.producto.id === id ? { ...i, cantidad: i.cantidad + 1 } : i
      )
    );
  }, []);

  const disminuir = useCallback((id: string) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === id);
      if (!existente) return prev;
      if (existente.cantidad <= 1) {
        return prev.filter((i) => i.producto.id !== id);
      }
      return prev.map((i) =>
        i.producto.id === id ? { ...i, cantidad: i.cantidad - 1 } : i
      );
    });
  }, []);

  const eliminar = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== id));
  }, []);

  const limpiar = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider value={{ items, agregar, aumentar, disminuir, eliminar, total, cantidadTotal, limpiar }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
