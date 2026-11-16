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
 * Zonas de envío: viven en la tabla `zonas_envio` de Supabase
 * (se leen en el checkout y las usa la RPC crear_pedido).
 * Acá solo quedan los métodos de entrega posibles.
 */

export const LIMITE_STOCK_BAJO = 5;

export const HORARIOS_TURNO = {
  DESDE: "09:00",
  HASTA: "17:00",
  INTERVALO_MINUTOS: 30,
} as const;

/**
 * Datos de contacto que se muestran en footer, /contacto y home.
 * Fuente única para no tener el teléfono/dirección hardcodeados en cada lado.
 */
export const CONTACTO = {
  DIRECCION: "Palma 189, Maipú, Mendoza",
  TELEFONO: "+54 261 555-1234",
  TELEFONO_HREF: "tel:+542615551234",
  /** Email al que apunta el formulario de /contacto vía mailto:. */
  EMAIL: "contacto.palma@gmail.com",
  /** Emergencias fuera de horario de atención. */
  EMERGENCIAS_24_7: true,
} as const;
