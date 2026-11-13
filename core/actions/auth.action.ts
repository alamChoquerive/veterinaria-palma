"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  loginSchema,
  registroSchema,
  type LoginInput,
  type RegistroInput,
} from "@/core/actions/schemas";

/**
 * Inicia sesión con email y contraseña.
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const rawInput: LoginInput = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    redirect: (formData.get("redirect") as string) || undefined,
  };

  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  const { email, password, redirect: redirectTo } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect(redirectTo ?? "/");
}

/**
 * Registra un nuevo cliente (rol minorista por defecto).
 */
export async function registroAction(formData: FormData): Promise<ActionResult> {
  const rawInput: RegistroInput = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    nombre: formData.get("nombre") as string,
    apellido: formData.get("apellido") as string,
  };

  const parsed = registroSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Datos inválidos",
    };
  }

  const { email, password, nombre, apellido } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, apellido },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { email } };
}

/**
 * Cierra la sesión del usuario.
 */
export async function logoutAction(): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = await createClient();

  await supabase.auth.signOut();
  cookieStore.delete("sb-auth-token");

  redirect("/login");
}
