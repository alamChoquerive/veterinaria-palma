"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import { verificarRateLimit } from "@/core/rate-limit";
import {
  crearVentaPresencialSchema,
  actualizarEstadoVentaSchema,
  type CrearVentaPresencialInput,
  type ActualizarEstadoVentaInput,
} from "@/core/actions/schemas";

async function rolDelUsuario(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();
  return data?.rol ?? null;
}

function esStaff(rol: string | null): boolean {
  return rol === "admin" || rol === "empleado";
}

/**
 * Registra una venta presencial (POS). Solo staff (admin o empleado).
 *
 * Toda la lógica (stock, precios, total) vive en la RPC
 * `crear_venta_presencial` con service_role: el cliente solo manda
 * qué productos y el método de pago.
 */
export async function crearVentaPresencial(
  input: CrearVentaPresencialInput,
): Promise<ActionResult<{ venta_id: string; total: number }>> {
  const parsed = crearVentaPresencialSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de venta inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const rol = await rolDelUsuario(user.id);
  if (!esStaff(rol)) {
    return { ok: false, error: "Solo el personal de la tienda puede registrar ventas" };
  }

  // Rate limit por usuario: 10 ventas por minuto
  const permitido = await verificarRateLimit(`venta:${user.id}`, 10, 60);
  if (!permitido) {
    return {
      ok: false,
      error: "Demasiadas solicitudes. Probá de nuevo en un minuto.",
    };
  }

  const { clienteNombre, metodoPago, items } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("crear_venta_presencial", {
    p_perfil_id: user.id,
    p_cliente_nombre: clienteNombre?.trim() ? clienteNombre.trim() : null,
    p_metodo_pago: metodoPago,
    p_items: items.map((i) => ({
      producto_id: i.productoId,
      cantidad: i.cantidad,
    })),
  });

  if (error || !data) {
    console.error(
      "[crearVentaPresencial] Error en la RPC:",
      error?.message,
    );
    const mensaje =
      (error as { code?: string } | null)?.code === "P0001"
        ? (error?.message ?? "No se pudo registrar la venta")
        : "No se pudo registrar la venta. Intentá de nuevo.";
    return { ok: false, error: mensaje };
  }

  revalidatePath("/empleado/pos");
  revalidatePath("/empleado/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");

  const resultado = data as { venta_id: string; total: number };
  return { ok: true, data: resultado };
}

/**
 * Cambia el estado de una venta presencial (ej. marcar pagada una venta
 * con Mercado Pago pendiente, o cancelarla). Solo staff. Como la tabla
 * ventas no tiene policy de escritura para usuarios, el update se hace
 * con service_role después de verificar el rol.
 */
export async function actualizarEstadoVenta(
  input: ActualizarEstadoVentaInput,
): Promise<ActionResult> {
  const parsed = actualizarEstadoVentaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de venta inválidos",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const rol = await rolDelUsuario(user.id);
  if (!esStaff(rol)) {
    return { ok: false, error: "Solo el personal de la tienda puede actualizar ventas" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ventas")
    .update({ estado: parsed.data.estado })
    .eq("id", parsed.data.ventaId);

  if (error) {
    console.error("[actualizarEstadoVenta] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar la venta" };
  }

  revalidatePath("/empleado/pos");
  revalidatePath("/admin/ventas");
  return { ok: true, data: { estado: parsed.data.estado } };
}
