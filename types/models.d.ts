import type { Database } from "./database.types";

export type Role = Database["public"]["Tables"]["perfiles"]["Row"]["rol"];

export type ProductoPublico = {
  id: string;
  nombre: string;
  descripcion?: string;
  /** Precio ya resuelto según el rol del usuario (minorista / mayorista) */
  precio: number;
  precio_minorista: number;
  precio_mayorista: number;
  stock: number;
  imagen_url?: string;
  categoria?: string;
};

export type TurnoDisponible = {
  fecha: string;
  hora: string;
  disponible: boolean;
};

export type CarritoItem = {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type MetodoEntrega = "retiro_tienda" | "envio_local" | "envio_provincial";
