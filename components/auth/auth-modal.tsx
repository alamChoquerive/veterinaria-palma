"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, registroAction } from "@/core/actions/auth.action";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type AuthTab = "login" | "registro";

/**
 * Modal de autenticación que se abre encima de cualquier página pública
 * (home, tienda, turnos...) sin navegar a /login.
 *
 * Reutiliza EXACTAMENTE las mismas Server Actions de auth.action.ts (mismo
 * rate limit, mismos logs en logs_acceso, misma validación Zod): el login
 * manda modoModal=1 para que loginAction no redirija. Al autenticarse con
 * éxito se cierra el modal y se hace router.refresh() para que los Server
 * Components (navbar con sesión, precios por rol, acceso a /cuenta) se
 * actualicen en la misma página.
 *
 * /login queda intacta como fallback para enlaces directos y para las
 * redirecciones del proxy en rutas protegidas.
 */
export function AuthModal({
  onClose,
  redirectDestino = null,
  errorInicial = null,
  tabInicial = "login",
}: {
  onClose: () => void;
  /** Destino validado (interno) cuando venimos de una ruta protegida: /login?redirect=... */
  redirectDestino?: string | null;
  /** Error que viene por URL: /login?error=... (ej. acceso denegado a /admin) */
  errorInicial?: string | null;
  tabInicial?: AuthTab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>(tabInicial);
  const [error, setError] = useState<string | null>(errorInicial);
  const [loading, setLoading] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Cierre con tecla Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("modoModal", "1"); // loginAction: sin redirect, devuelve el rol
    const result = await loginAction(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Si venimos de una ruta protegida (/login?redirect=/cuenta), navegamos
    // al destino pedido; si no, cerramos y refrescamos la página actual.
    if (redirectDestino) {
      router.replace(redirectDestino);
      return;
    }
    onClose();
    router.refresh();
  }

  async function handleRegistro(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await registroAction(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Si la confirmación de email está desactivada, la sesión ya inició
    setRegistroExitoso(true);
    router.refresh();
  }

  function cambiarTab(t: AuthTab) {
    setTab(t);
    setError(null);
    setRegistroExitoso(false);
  }

  const estiloTab = (activa: boolean) =>
    `py-2 text-sm font-medium rounded-md transition-colors ${
      activa
        ? "bg-white text-[#1e293b] shadow-sm"
        : "text-[#64748b] hover:text-[#1e293b]"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Iniciar sesión o crear cuenta"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-[#1e293b] mb-4 pr-8">
          {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h2>

        {/* Segmented control */}
        <div className="grid grid-cols-2 gap-1 bg-[#f1f5f9] rounded-lg p-1 mb-5">
          <button
            type="button"
            onClick={() => cambiarTab("login")}
            className={estiloTab(tab === "login")}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => cambiarTab("registro")}
            className={estiloTab(tab === "registro")}
          >
            Crear cuenta
          </button>
        </div>

        {errorInicial && (
          <p className="text-sm text-destructive mb-3">{errorInicial}</p>
        )}

        {tab === "login" ? (
          <form action={handleLogin} className="space-y-3">
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
            />
            <Input
              name="password"
              type="password"
              placeholder="Contraseña"
              required
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        ) : registroExitoso ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[#065f46] bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-3">
              Cuenta creada correctamente. Si tu proyecto de Supabase tiene la
              confirmación de email activada, revisá tu correo antes de entrar.
            </p>
            <Button
              type="button"
              className="w-full"
              onClick={() => cambiarTab("login")}
            >
              Ir a iniciar sesión
            </Button>
          </div>
        ) : (
          <form action={handleRegistro} className="space-y-3">
            <Input name="nombre" placeholder="Nombre" required minLength={2} />
            <Input name="apellido" placeholder="Apellido" required minLength={2} />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
            />
            <Input
              name="password"
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
        )}

        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      </div>
    </div>
  );
}
