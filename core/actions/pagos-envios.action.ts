"use server";

import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  toggleMedioPagoSchema,
  actualizarZonaEnvioSchema,
  type ToggleMedioPagoInput,
  type ActualizarZonaEnvioInput,
} from "@/core/actions/schemas";

async function esAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();
  return data?.rol === "admin";
}

/**
 * Habilita o deshabilita un medio de pago. Solo admin
 * (RLS "medios pago admin escritura").
 */
export async function toggleMedioPago(
  input: ToggleMedioPagoInput,
): Promise<ActionResult> {
  const parsed = toggleMedioPagoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  if (!(await esAdmin(user.id))) {
    return { ok: false, error: "Solo un administrador puede cambiar los medios de pago" };
  }

  const { error } = await supabase
    .from("medios_pago")
    .update({ activo: parsed.data.activo })
    .eq("id", parsed.data.medioPagoId);

  if (error) {
    console.error("[toggleMedioPago] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar el medio de pago" };
  }

  revalidatePath("/admin/pagos-envios");
  return { ok: true, data: { activo: parsed.data.activo } };
}

/**
 * Actualiza costo y estado de una zona de envío. Solo admin
 * (RLS "zonas admin escritura").
 */
export async function actualizarZonaEnvio(
  input: ActualizarZonaEnvioInput,
): Promise<ActionResult> {
  const parsed = actualizarZonaEnvioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de zona inválidos",
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

  if (!(await esAdmin(user.id))) {
    return { ok: false, error: "Solo un administrador puede cambiar las zonas de envío" };
  }

  const { error } = await supabase
    .from("zonas_envio")
    .update({ costo: parsed.data.costo, activo: parsed.data.activo })
    .eq("id", parsed.data.zonaId);

  if (error) {
    console.error("[actualizarZonaEnvio] Error:", error.message);
    return { ok: false, error: "No se pudo actualizar la zona de envío" };
  }

  revalidatePath("/admin/pagos-envios");
  revalidatePath("/checkout");
  return { ok: true, data: { actualizado: true } };
}
