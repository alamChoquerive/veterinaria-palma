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
  motivo: z.string().max(300, "El motivo es demasiado largo").optional(),
});

export const actualizarStockSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  cantidad: z.number().int("La cantidad debe ser un número entero"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type CrearTurnoInput = z.infer<typeof crearTurnoSchema>;
export type ActualizarStockInput = z.infer<typeof actualizarStockSchema>;

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
