"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

/**
 * Inicia sesión con email y contraseña.
 */
export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirect") as string) || "/";

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect(redirectTo);
}

/**
 * Registra un nuevo cliente (rol minorista por defecto).
 */
export async function registroAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nombre = formData.get("nombre") as string;
  const apellido = formData.get("apellido") as string;

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
