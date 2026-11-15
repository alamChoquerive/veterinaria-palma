"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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

/**
 * Store del carrito con persistencia en localStorage.
 *
 * Al ir a Mercado Pago hay una recarga completa de la página: sin persistencia
 * el carrito se perdía; con ella vuelve cargado y /checkout/exito lo vacía
 * cuando el pago queda confirmado.
 *
 * Se implementa con useSyncExternalStore (no con useState + useEffect) para
 * leer localStorage de forma segura en SSR sin errores de hidratación.
 */
const CLAVE = "palma:carrito:v1";
const VACIO: CartItem[] = [];
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function leer(): CartItem[] {
  if (cache) return cache;
  if (typeof window === "undefined") return VACIO;
  try {
    const parseado: unknown = JSON.parse(window.localStorage.getItem(CLAVE) ?? "[]");
    cache = Array.isArray(parseado) ? (parseado as CartItem[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function escribir(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // sin espacio en localStorage: el carrito igual funciona en memoria
  }
  for (const listener of listeners) listener();
}

function suscribir(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return leer();
}

function getServerSnapshot() {
  return VACIO;
}

function actualizar(fn: (prev: CartItem[]) => CartItem[]) {
  escribir(fn(leer()));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(suscribir, getSnapshot, getServerSnapshot);

  const total = items.reduce(
    (sum, item) => sum + Number(item.producto.precio_minorista) * item.cantidad,
    0,
  );
  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);

  const agregar = useCallback((producto: Producto) => {
    actualizar((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  }, []);

  const aumentar = useCallback((id: string) => {
    actualizar((prev) =>
      prev.map((i) =>
        i.producto.id === id ? { ...i, cantidad: i.cantidad + 1 } : i,
      ),
    );
  }, []);

  const disminuir = useCallback((id: string) => {
    actualizar((prev) => {
      const existente = prev.find((i) => i.producto.id === id);
      if (!existente) return prev;
      if (existente.cantidad <= 1) {
        return prev.filter((i) => i.producto.id !== id);
      }
      return prev.map((i) =>
        i.producto.id === id ? { ...i, cantidad: i.cantidad - 1 } : i,
      );
    });
  }, []);

  const eliminar = useCallback((id: string) => {
    actualizar((prev) => prev.filter((i) => i.producto.id !== id));
  }, []);

  const limpiar = useCallback(() => escribir([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        agregar,
        aumentar,
        disminuir,
        eliminar,
        total,
        cantidadTotal,
        limpiar,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
