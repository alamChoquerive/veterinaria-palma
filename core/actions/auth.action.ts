"use server";

import { createClient } from "@/core/supabase/server";
import type { ActionResult } from "@/types/api";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { esRedirectInterno } from "@/lib/redirect";
import { ipDelCliente, verificarRateLimit } from "@/core/rate-limit";
import {
  loginSchema,
  registroSchema,
  type LoginInput,
  type RegistroInput,
} from "@/core/actions/schemas";

/**
 * En desarrollo se agrega el detalle real del error de Supabase Auth al
 * mensaje (code/status/message) para poder debuggear; en producción el
 * cliente solo recibe el mensaje genérico.
 */
function detalleAuthDev(error: {
  code?: string;
  status?: number;
  message: string;
}): string {
  if (process.env.NODE_ENV === "production") return "";
  const codigo = error.code ?? "sin-code";
  const status = error.status ? ` HTTP ${error.status}` : "";
  return ` [dev: ${codigo}${status} — ${error.message}]`;
}

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
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { email, password, redirect: redirectTo } = parsed.data;

  // Rate limit por IP: 10 intentos de login cada 15 minutos
  const ip = await ipDelCliente();
  const permitido = await verificarRateLimit(`login:${ip}`, 10, 15 * 60);
  if (!permitido) {
    return {
      ok: false,
      error: "Demasiados intentos. Probá de nuevo en unos minutos.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // El detalle queda en el log; al cliente nunca le mostramos el mensaje de Supabase
    console.error(
      "[loginAction] Error de Supabase Auth:",
      error.code,
      error.status,
      error.message,
    );
    const mensaje =
      error.code === "invalid_credentials"
        ? "Email o contraseña incorrectos"
        : "No se pudo iniciar sesión. Intentá de nuevo.";
    return { ok: false, error: mensaje + detalleAuthDev(error) };
  }

  // Open redirect: solo se redirige a rutas internas de la app;
  // cualquier otra cosa cae en "/".
  const destino = esRedirectInterno(redirectTo) ? redirectTo : "/";
  redirect(destino);
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
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { email, password, nombre, apellido } = parsed.data;

  // Rate limit por IP: 10 registros cada 15 minutos
  const ip = await ipDelCliente();
  const permitido = await verificarRateLimit(`registro:${ip}`, 10, 15 * 60);
  if (!permitido) {
    return {
      ok: false,
      error: "Demasiados intentos. Probá de nuevo en unos minutos.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, apellido },
    },
  });

  if (error) {
    console.error(
      "[registroAction] Error de Supabase Auth:",
      error.code,
      error.status,
      error.message,
    );
    // Email ya registrado: mensaje específico para no dejar al usuario en duda
    const yaRegistrado =
      error.code === "user_already_registered" ||
      error.message.toLowerCase().includes("already registered");
    // Supabase Auth rechaza dominios reservados (RFC 2606: .test, .example,
    // .invalid, .localhost) con email_address_invalid
    const emailInvalido = error.code === "email_address_invalid";
    // El proyecto de Supabase tiene el proveedor Email desactivado
    const emailDesactivado = error.code === "email_provider_disabled";
    const mensaje = yaRegistrado
      ? "Ya existe una cuenta con ese email. Probá iniciar sesión."
      : emailInvalido
        ? "Ese email no es válido o usa un dominio no permitido (ej. .test). Probá con un dominio real como gmail.com."
        : emailDesactivado
          ? "El registro con email está desactivado en el proyecto de Supabase (Authentication → Providers → Email)."
          : "No se pudo completar el registro. Verificá los datos o probá con otro email.";
    return { ok: false, error: mensaje + detalleAuthDev(error) };
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
