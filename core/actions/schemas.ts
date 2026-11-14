import { z } from "zod";

/**
 * Esquemas de validación para Server Actions.
 * Cada schema valida los datos de entrada antes de tocar la base de datos.
 */

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  // Solo rutas internas; la validación fina está en lib/redirect.ts
  redirect: z.string().max(500, "Redirección inválida").optional(),
});

export const registroSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().trim().min(2, "El apellido debe tener al menos 2 caracteres"),
});

const textoOpcional = (max: number, mensaje: string) =>
  z.string().trim().max(max, mensaje).optional().or(z.literal(""));

export const crearTurnoSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)")
    .refine((d) => !isNaN(Date.parse(d + "T00:00:00")), "Fecha inválida"),
  horaInicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  horaFin: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  motivo: textoOpcional(300, "El motivo es demasiado largo"),
  // Datos del turno que el flujo online ya recolecta (se guardan en la DB)
  especialidad: textoOpcional(80, "Especialidad inválida"),
  mascotaNombre: textoOpcional(80, "El nombre de la mascota es demasiado largo"),
  mascotaEspecie: textoOpcional(30, "Especie inválida"),
  responsableNombre: textoOpcional(120, "El nombre del responsable es demasiado largo"),
  responsableTelefono: textoOpcional(30, "El teléfono es demasiado largo"),
});

/**
 * Turno presencial (atención en el local, sin cuenta de cliente).
 * Lo crea un admin desde el panel; el responsable es obligatorio.
 */
export const crearTurnoPresencialSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)")
    .refine((d) => !isNaN(Date.parse(d + "T00:00:00")), "Fecha inválida"),
  horaInicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  horaFin: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)"),
  especialidad: z
    .string()
    .trim()
    .min(2, "Elegí una especialidad")
    .max(80, "Especialidad inválida"),
  mascotaNombre: textoOpcional(80, "El nombre de la mascota es demasiado largo"),
  mascotaEspecie: z
    .enum(["perro", "gato", "otro"], { message: "Elegí la especie de la mascota" }),
  responsableNombre: z
    .string()
    .trim()
    .min(2, "El nombre del responsable es obligatorio")
    .max(120, "El nombre del responsable es demasiado largo"),
  responsableTelefono: textoOpcional(30, "El teléfono es demasiado largo"),
  motivo: textoOpcional(300, "El motivo es demasiado largo"),
});

export const actualizarStockSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  cantidad: z.number().int("La cantidad debe ser un número entero"),
});

/**
 * Edición de un producto desde el panel admin.
 * La autorización real es RLS ("productos admin escritura"): solo un admin
 * puede escribir; la action además verifica que haya sesión.
 */
export const actualizarProductoSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  descripcion: z.string().trim().max(500, "La descripción es demasiado larga").optional(),
  categoriaId: z
    .string()
    .uuid("Categoría inválida")
    .nullable()
    .optional(),
  imagenUrl: z
    .string()
    .trim()
    .max(500, "La URL de la imagen es demasiado larga")
    .optional()
    .or(z.literal("")),
  precioMinorista: z.number().min(0, "El precio no puede ser negativo"),
  precioMayorista: z.number().min(0, "El precio no puede ser negativo"),
  stock: z
    .number()
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
  stockMinimo: z
    .number()
    .int("El stock mínimo debe ser un número entero")
    .min(0, "El stock mínimo no puede ser negativo"),
  activo: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type CrearTurnoInput = z.infer<typeof crearTurnoSchema>;
export type CrearTurnoPresencialInput = z.infer<typeof crearTurnoPresencialSchema>;
export type ActualizarStockInput = z.infer<typeof actualizarStockSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;

/**
 * Creación de pedido: el cliente SOLO envía qué productos quiere y el método
 * de entrega. Precios, costo de envío y total los calcula el servidor
 * (RPC crear_pedido), nunca se aceptan del cliente.
 */
export const crearPedidoSchema = z
  .object({
    metodoEntrega: z.enum(["retiro_tienda", "envio_local", "envio_provincial"]),
    direccionEnvio: z
      .string()
      .max(200, "La dirección es demasiado larga")
      .optional(),
    items: z
      .array(
        z.object({
          productoId: z.string().uuid("ID de producto inválido"),
          cantidad: z
            .number()
            .int("La cantidad debe ser un número entero")
            .positive("La cantidad debe ser positiva")
            .max(9999, "Cantidad demasiado alta"),
        })
      )
      .min(1, "El pedido debe tener al menos un producto"),
  })
  .refine(
    (d) =>
      d.metodoEntrega === "retiro_tienda" ||
      (d.direccionEnvio ?? "").trim().length > 0,
    {
      message: "La dirección de envío es obligatoria para este método de entrega",
      path: ["direccionEnvio"],
    }
  );

/**
 * Inicio de pago: solo el id del pedido. El monto se lee de la base de datos.
 */
export const preferenciaPagoSchema = z.object({
  pedidoId: z.string().uuid("ID de pedido inválido"),
});

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;
export type PreferenciaPagoInput = z.infer<typeof preferenciaPagoSchema>;

/**
 * Cambio de estado de un pedido desde el panel admin (solo admin).
 */
export const actualizarEstadoPedidoSchema = z.object({
  pedidoId: z.string().uuid("ID de pedido inválido"),
  estado: z.enum([
    "pendiente",
    "pago_pendiente",
    "pagado",
    "preparando",
    "enviado",
    "entregado",
    "retiro_pendiente",
    "cancelado",
  ]),
});

export type ActualizarEstadoPedidoInput = z.infer<typeof actualizarEstadoPedidoSchema>;

/**
 * Datos de un proveedor (crear/editar desde el panel admin).
 */
export const proveedorSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre del proveedor debe tener al menos 2 caracteres")
    .max(120, "El nombre es demasiado largo"),
  contactoNombre: textoOpcional(120, "El nombre del contacto es demasiado largo"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(200, "El email es demasiado largo")
    .optional()
    .or(z.literal("")),
  telefono: textoOpcional(30, "El teléfono es demasiado largo"),
  categoria: z
    .string()
    .trim()
    .min(2, "Indicá qué provee (alimentos, farmacia, accesorios...)")
    .max(80, "La categoría es demasiado larga"),
  descripcion: textoOpcional(1000, "La descripción es demasiado larga"),
  activo: z.boolean(),
  montoPendiente: z
    .number()
    .min(0, "El monto no puede ser negativo")
    .max(99999999, "Monto demasiado alto"),
  ultimoPedidoFecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (AAAA-MM-DD)")
    .optional()
    .or(z.literal("")),
});

export const crearProveedorSchema = proveedorSchema;
export const actualizarProveedorSchema = proveedorSchema.extend({
  proveedorId: z.string().uuid("ID de proveedor inválido"),
});

export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorInput = z.infer<typeof actualizarProveedorSchema>;

/**
 * Precios de un producto desde la sección Precios (costo + precios de venta).
 */
export const actualizarPreciosProductoSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  precioCosto: z
    .number()
    .min(0, "El costo no puede ser negativo")
    .max(99999999, "Costo demasiado alto")
    .nullable()
    .optional(),
  precioMinorista: z.number().min(0, "El precio no puede ser negativo"),
  precioMayorista: z.number().min(0, "El precio no puede ser negativo"),
});

/**
 * Aplica un margen global sobre el precio de costo de TODOS los productos
 * que tengan costo cargado. El margen también se guarda en config_tienda.
 */
export const aplicarMargenGlobalSchema = z.object({
  tipo: z.enum(["minorista", "mayorista"]),
  porcentaje: z
    .number()
    .min(0, "El margen no puede ser negativo")
    .max(500, "Margen demasiado alto"),
});

export type ActualizarPreciosProductoInput = z.infer<typeof actualizarPreciosProductoSchema>;
export type AplicarMargenGlobalInput = z.infer<typeof aplicarMargenGlobalSchema>;

/**
 * Habilitar/deshabilitar un medio de pago (solo admin).
 */
export const toggleMedioPagoSchema = z.object({
  medioPagoId: z.string().uuid("ID inválido"),
  activo: z.boolean(),
});

/**
 * Editar costo y estado de una zona de envío (solo admin).
 */
export const actualizarZonaEnvioSchema = z.object({
  zonaId: z.string().uuid("ID de zona inválido"),
  costo: z.number().min(0, "El costo no puede ser negativo"),
  activo: z.boolean(),
});

export type ToggleMedioPagoInput = z.infer<typeof toggleMedioPagoSchema>;
export type ActualizarZonaEnvioInput = z.infer<typeof actualizarZonaEnvioSchema>;
