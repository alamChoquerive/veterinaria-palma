"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import { revalidatePath } from "next/cache";
import {
  crearTurnoSchema,
  type CrearTurnoInput,
} from "@/core/actions/schemas";

/**
 * Crea un turno para el cliente autenticado.
 */
export async function crearTurno(
  datos: CrearTurnoInput,
): Promise<ActionResult> {
  const parsed = crearTurnoSchema.safeParse(datos);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos de turno inválidos",
    };
  }

  const { fecha, horaInicio, horaFin, motivo } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const { error } = await supabase.from("turnos").insert({
    perfil_id: user.id,
    fecha,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    motivo: motivo ?? null,
    estado: "pendiente",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/turnos");
  return { ok: true, data: { creado: true } };
}

/**
 * Cancela un turno (solo el dueño o un admin).
 */
export async function cancelarTurno(turnoId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Usuario no autenticado" };
  }

  const { error } = await supabase
    .from("turnos")
    .update({ estado: "cancelado" })
    .eq("id", turnoId)
    .eq("perfil_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/turnos");
  revalidatePath("/admin/agenda");
  return { ok: true, data: { cancelado: true } };
}
