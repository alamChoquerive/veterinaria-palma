"use client";

import { useRouter } from "next/navigation";
import { AuthModal, type AuthTab } from "@/components/auth/auth-modal";

/**
 * Wrapper client de la página /login: monta el AuthModal siempre abierto.
 * Si el usuario cierra el modal sin iniciar sesión, vuelve al inicio.
 */
export function LoginPageModal({
  redirectDestino,
  errorInicial,
  tabInicial,
}: {
  redirectDestino: string | null;
  errorInicial: string | null;
  tabInicial: AuthTab;
}) {
  const router = useRouter();
  return (
    <AuthModal
      onClose={() => router.replace("/")}
      redirectDestino={redirectDestino}
      errorInicial={errorInicial}
      tabInicial={tabInicial}
    />
  );
}
