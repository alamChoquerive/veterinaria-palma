"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthModal } from "@/components/auth/auth-modal";
import { ROLES, rutaPanelPorRol } from "@/lib/constants";

const iconoUsuario = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5.121 17.804A13.9 13.9 0 015 20c-1 0 1.954.177 3.857.586M11 9.885V14m4 0v4.111m-10 .111v1.766c0 .832.096 1.653.274 2.454-.365.05-.73.095-1.095.095-1.886 0-3.427-1.4-3.857-3.172A14.6 14.6 0 0111 9.885zM16.564 16.564a1 1 0 01-1.414 0l-2.829-2.829a1 1 0 011.414-1.414l2.829 2.829a1 1 0 010 1.414z"
    />
  </svg>
);

/**
 * Header del gateway (home). Igual que el Navbar: con sesión el ícono lleva
 * al panel del rol (admin/empleado) o a /cuenta si es cliente; sin sesión
 * abre el AuthModal encima del gateway en vez de navegar a /login, así el
 * modal es la única entrada de login/registro.
 */
export function GatewayHeader({
  tieneSesion,
  rol = null,
}: {
  tieneSesion: boolean;
  rol?: string | null;
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const panel = rutaPanelPorRol(rol);
  const hrefCuenta = panel ?? "/cuenta";
  const etiquetaCuenta = panel
    ? rol === ROLES.ADMIN
      ? "Ir al panel de administración"
      : "Ir al panel de empleado"
    : "Ir a mi cuenta";

  return (
    <>
      <header className="border-b border-[#e2e8f0] bg-white px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center text-white text-sm font-medium">
            P
          </div>
          <span className="font-semibold text-[#1e293b] tracking-tight hidden sm:inline">
            Veterinaria Palma
          </span>
        </div>
        <div className="flex items-center gap-3">
          {tieneSesion ? (
            <Link
              href={hrefCuenta}
              className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
              aria-label={etiquetaCuenta}
            >
              {iconoUsuario}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
              aria-label="Iniciar sesión o registrarse"
            >
              {iconoUsuario}
            </button>
          )}
        </div>
      </header>

      {authOpen && !tieneSesion && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
