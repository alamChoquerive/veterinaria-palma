/**
 * Variables estáticas de la aplicación: roles, zonas de envío, estados de turno.
 * Centralizadas para no repetir "strings mágicos" en componentes ni actions.
 */

export const ROLES = {
  MINORISTA: "minorista",
  MAYORISTA: "mayorista",
  ADMIN: "admin",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ESTADOS_TURNO = {
  PENDIENTE: "pendiente",
  CONFIRMADO: "confirmado",
  ATENDIDO: "atendido",
  CANCELADO: "cancelado",
} as const;

export const METODOS_ENTREGA = {
  RETIRO_TIENDA: "retiro_tienda",
  ENVIO_LOCAL: "envio_local",
  ENVIO_PROVINCIAL: "envio_provincial",
} as const;

export const ESTADOS_PEDIDO = {
  PENDIENTE: "pendiente",
  PAGO_PENDIENTE: "pago_pendiente",
  PAGADO: "pagado",
  PREPARANDO: "preparando",
  ENVIADO: "enviado",
  ENTREGADO: "entregado",
  RETIRO_PENDIENTE: "retiro_pendiente",
  CANCELADO: "cancelado",
} as const;

/**
 * Zonas de envío con su costo base.
 * Estos valores se sincronizan con la tabla `zonas_envio` de Supabase.
 */
export const ZONAS_ENVIO = {
  RETIRO_TIENDA: { id: "retiro-tienda", nombre: "Retiro en tienda", tipo: "local" as const, costo: 0 },
  ENVIO_LOCAL: { id: "envio-local", nombre: "Envío local (ciudad)", tipo: "local" as const, costo: 3000 },
  ENVIO_PROVINCIAL: { id: "envio-provincial", nombre: "Envío provincial", tipo: "provincial" as const, costo: 8000 },
} as const;

export const LIMITE_STOCK_BAJO = 5;

export const HORARIOS_TURNO = {
  DESDE: "09:00",
  HASTA: "17:00",
  INTERVALO_MINUTOS: 30,
} as const;
