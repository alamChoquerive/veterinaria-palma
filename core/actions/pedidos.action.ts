"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  actualizarEstadoPedidoSchema,
  type ActualizarEstadoPedidoInput,
} from "@/core/actions/schemas";

/**
 * Cambia el estado de un pedido desde el panel admin.
 * Solo rol admin (RLS también dejaría ver/editar a admin, pero el dueño
 * no puede usar esta action porque se verifica el rol con service_role).
 */
export async function actualizarEstadoPedido(
  input: ActualizarEstadoPedidoInput,
): Promise<ActionResult> {
  const parsed = actualizarEstadoPedidoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de pedido inválidos",
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

  const admin = createAdminClient();
  const { data: perfil } = await admin
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.rol !== "admin") {
    return { ok: false, error: "Solo un administrador puede cambiar el estado de un pedido" };
  }

  const { error } = await supabase
    .from("pedidos")
    .update({ estado: parsed.data.estado, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.pedidoId);

  if (error) {
    console.error("[actualizarEstadoPedido] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar el pedido" };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/ventas");
  revalidatePath("/admin/dashboard");
  revalidatePath("/cuenta");
  return { ok: true, data: { estado: parsed.data.estado } };
}
