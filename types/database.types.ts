/**
 * Tipos generados del esquema de Supabase.
 * Sincronizar con `supabase/migrations/0001_schema_inicial.sql` (o con
 * `npx supabase gen types typescript --local` si usas Supabase CLI local).
 */
export type Role = "minorista" | "mayorista" | "admin";

export type Perfil = {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  rol: Role;
  created_at: string;
  updated_at: string;
};

export type Categoria = {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
};

export type Producto = {
  id: string;
  categoria_id: string | null;
  nombre: string;
  descripcion?: string;
  precio_minorista: number;
  precio_mayorista: number;
  stock: number;
  stock_minimo: number;
  imagen_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type Turno = {
  id: string;
  perfil_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string;
  estado: "pendiente" | "confirmado" | "atendido" | "cancelado";
  notas?: string;
  created_at: string;
};

export type Pedido = {
  id: string;
  perfil_id: string | null;
  estado: string;
  metodo_entrega: "retiro_tienda" | "envio_local" | "envio_provincial";
  direccion_envio?: string;
  costo_envio: number;
  total: number;
  created_at: string;
  updated_at: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type Pago = {
  id: string;
  pedido_id: string;
  proveedor: string;
  proveedor_pago_id?: string;
  estado: string;
  monto: number;
  raw?: any;
  created_at: string;
};

export type ZonaEnvio = {
  id: string;
  nombre: string;
  tipo: "local" | "provincial";
  costo: number;
  activo: boolean;
};

export type Database = {
  public: {
    Tables: {
      perfiles: { Row: Perfil; Insert: Omit<Perfil, "created_at" | "updated_at">; Update: Partial<Perfil> };
      categorias: { Row: Categoria; Insert: Omit<Categoria, "created_at">; Update: Partial<Categoria> };
      productos: { Row: Producto; Insert: Omit<Producto, "created_at" | "updated_at">; Update: Partial<Producto> };
      turnos: { Row: Turno; Insert: Omit<Turno, "created_at">; Update: Partial<Turno> };
      pedidos: { Row: Pedido; Insert: Omit<Pedido, "created_at" | "updated_at">; Update: Partial<Pedido> };
      pedido_items: { Row: PedidoItem; Insert: Omit<PedidoItem, "id">; Update: Partial<PedidoItem> };
      pagos: { Row: Pago; Insert: Omit<Pago, "id" | "created_at">; Update: Partial<Pago> };
      zonas_envio: { Row: ZonaEnvio; Insert: Omit<ZonaEnvio, "id">; Update: Partial<ZonaEnvio> };
    };
  };
};
