/**
 * Variables estáticas de la aplicación: roles, zonas de envío, estados de turno.
 * Centralizadas para no repetir "strings mágicos" en componentes ni actions.
 */

export const ROLES = {
  MINORISTA: "minorista",
  MAYORISTA: "mayorista",
  EMPLEADO: "empleado",
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

/**
 * Etiquetas y colores de estado HUMANIZADOS, compartidos por /cuenta y los
 * paneles (antes había 4 copias de COLOR_ESTADO con valores divergentes,
 * ej. retiro_pendiente ámbar en /cuenta vs verde en el admin).
 * OJO: las clases Tailwind deben quedar literales acá para que el compilador
 * las genere (constants.ts se escanea igual que los .tsx).
 */
export const ETIQUETA_ESTADO_TURNO: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  atendido: "Atendido",
  cancelado: "Cancelado",
};

export const COLOR_ESTADO_TURNO: Record<string, string> = {
  pendiente: "bg-[#fef3c7] text-[#92400e]",
  confirmado: "bg-[#dbeafe] text-[#1e40af]",
  atendido: "bg-[#d1fae5] text-[#065f46]",
  cancelado: "bg-[#fee2e2] text-[#991b1b]",
};

export const ETIQUETA_ESTADO_PEDIDO: Record<string, string> = {
  pendiente: "Pendiente",
  pago_pendiente: "Pago pendiente",
  pagado: "Pagado",
  preparando: "En preparación",
  enviado: "En camino",
  entregado: "Entregado",
  retiro_pendiente: "Listo para retirar",
  cancelado: "Cancelado",
};

export const COLOR_ESTADO_PEDIDO: Record<string, string> = {
  pendiente: "bg-[#fef3c7] text-[#92400e]",
  pago_pendiente: "bg-[#fef3c7] text-[#92400e]",
  pagado: "bg-[#d1fae5] text-[#065f46]",
  preparando: "bg-[#dbeafe] text-[#1e40af]",
  enviado: "bg-[#dbeafe] text-[#1e40af]",
  entregado: "bg-[#d1fae5] text-[#065f46]",
  // ámbar: todavía falta una acción (retirar en la tienda)
  retiro_pendiente: "bg-[#fef3c7] text-[#92400e]",
  cancelado: "bg-[#fee2e2] text-[#991b1b]",
};

export const ETIQUETA_ENVIO: Record<string, string> = {
  retiro_tienda: "Retiro en local",
  envio_local: "Envío local",
  envio_provincial: "Envío provincial",
};

/**
 * Estados de las ventas presenciales (tabla `ventas`, POS del empleado).
 * Antes vivían duplicados dentro de pos-panel.tsx.
 */
export const ESTADOS_VENTA = {
  PAGADA: "pagada",
  PAGO_PENDIENTE: "pago_pendiente",
  CANCELADA: "cancelada",
} as const;

export const ETIQUETA_ESTADO_VENTA: Record<string, string> = {
  pagada: "Pagada",
  pago_pendiente: "Pago pendiente",
  cancelado: "Cancelada",
};

export const COLOR_ESTADO_VENTA: Record<string, string> = {
  pagada: "bg-[#d1fae5] text-[#065f46]",
  pago_pendiente: "bg-[#fef3c7] text-[#92400e]",
  cancelado: "bg-[#fee2e2] text-[#991b1b]",
};

/** Métodos de pago que acepta el POS (coinciden con el enum del schema). */
export const METODOS_PAGO_POS = ["efectivo", "mercadopago"] as const;

export const ETIQUETA_ROL: Record<string, string> = {
  minorista: "Minorista",
  mayorista: "Mayorista",
  admin: "Administrador",
  empleado: "Empleado",
};

/**
 * Panel de gestión según el rol: admin y empleado tienen el suyo propio.
 * Los clientes (minorista/mayorista) no tienen panel → null (usan /cuenta).
 * Lo usan el redirect post-login del AuthModal y el ícono de cuenta del
 * navbar/gateway, para que el staff llegue directo a su panel.
 */
export function rutaPanelPorRol(rol: string | null | undefined): string | null {
  if (rol === ROLES.ADMIN) return "/admin/dashboard";
  if (rol === ROLES.EMPLEADO) return "/empleado/dashboard";
  return null;
}
