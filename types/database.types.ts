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
  raw?: unknown;
  created_at: string;
};

export type MetodoEntrega = "retiro_tienda" | "envio_local" | "envio_provincial";

export type ZonaEnvio = {
  id: string;
  nombre: string;
  tipo: "local" | "provincial";
  metodo_entrega: MetodoEntrega;
  costo: number;
  activo: boolean;
};

export type Database = {
  public: {
    Tables: {
      perfiles: { Row: Perfil; Insert: Omit<Perfil, "created_at" | "updated_at">; Update: Partial<Perfil>; Relationships: [] };
      categorias: { Row: Categoria; Insert: Omit<Categoria, "created_at">; Update: Partial<Categoria>; Relationships: [] };
      productos: { Row: Producto; Insert: Omit<Producto, "created_at" | "updated_at">; Update: Partial<Producto>; Relationships: [] };
      turnos: { Row: Turno; Insert: Omit<Turno, "created_at">; Update: Partial<Turno>; Relationships: [] };
      pedidos: { Row: Pedido; Insert: Omit<Pedido, "created_at" | "updated_at">; Update: Partial<Pedido>; Relationships: [] };
      pedido_items: { Row: PedidoItem; Insert: Omit<PedidoItem, "id">; Update: Partial<PedidoItem>; Relationships: [] };
      pagos: { Row: Pago; Insert: Omit<Pago, "id" | "created_at">; Update: Partial<Pago>; Relationships: [] };
      zonas_envio: { Row: ZonaEnvio; Insert: Omit<ZonaEnvio, "id">; Update: Partial<ZonaEnvio>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      // Solo la ejecuta el servidor (service_role) — ver migración 0003.
      crear_pedido: {
        Args: {
          p_perfil_id: string;
          p_metodo_entrega: string;
          p_direccion_envio: string | null;
          p_items: unknown; // jsonb: [{ producto_id, cantidad }]
        };
        Returns: {
          pedido_id: string;
          subtotal: number;
          costo_envio: number;
          total: number;
        };
      };
      es_admin: { Args: Record<string, never>; Returns: boolean };
      rol_usuario_actual: { Args: Record<string, never>; Returns: string };
      // Solo la ejecuta el servidor (service_role) — ver migración 0005.
      crear_turno: {
        Args: {
          p_perfil_id: string;
          p_fecha: string; // date AAAA-MM-DD
          p_hora_inicio: string; // time HH:MM
          p_hora_fin: string; // time HH:MM
          p_motivo: string | null;
        };
        Returns: { turno_id: string };
      };
      // Solo la ejecuta el servidor (service_role) — ver migración 0006.
      verificar_rate_limit: {
        Args: {
          p_clave: string;
          p_max: number;
          p_ventana: string; // interval como texto, ej. "900 seconds"
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
