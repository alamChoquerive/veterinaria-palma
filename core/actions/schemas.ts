import { z } from "zod";

/**
 * Esquemas de validación para Server Actions.
 * Cada schema valida los datos de entrada antes de tocar la base de datos.
 */

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  redirect: z.string().optional(),
});

export const registroSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  nombre: z.string().min(1, "El nombre es requerido"),
  apellido: z.string().min(1, "El apellido es requerido"),
});

export const crearTurnoSchema = z.object({
  fecha: z.string().refine(
    (d) => !isNaN(Date.parse(d)),
    "Fecha inválida",
  ),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)"),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida (HH:MM)"),
  motivo: z.string().optional(),
});

export const actualizarStockSchema = z.object({
  productoId: z.string().uuid("ID de producto inválido"),
  cantidad: z.number().int("La cantidad debe ser un número entero"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type CrearTurnoInput = z.infer<typeof crearTurnoSchema>;
export type ActualizarStockInput = z.infer<typeof actualizarStockSchema>;

export const crearPedidoSchema = z.object({
  perfilId: z.string().uuid("ID de perfil inválido").optional(),
  metodoEntrega: z.enum(["retiro_tienda", "envio_local", "envio_provincial"]),
  direccionEnvio: z.string().optional(),
  costoEnvio: z.number().nonnegative("El costo de envío debe ser positivo"),
  total: z.number().nonnegative("El total debe ser positivo"),
  items: z.array(
    z.object({
      productoId: z.string().uuid(),
      cantidad: z.number().int().positive("La cantidad debe ser positiva"),
      precioUnitario: z.number().nonnegative(),
      subtotal: z.number().nonnegative(),
    })
  ),
});

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;
