"use client";

import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Marca */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-[#1e293b] tracking-tight text-lg"
        >
          <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center text-[10px] text-white">
            P
          </div>
          <span className="hidden sm:inline">Veterinaria Palma</span>
        </Link>

        {/* Centro */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#64748b]">
          <Link href="/" className="hover:text-[#1e293b] transition-colors">Inicio</Link>
          <Link href="/catalogo" className="hover:text-[#1e293b] transition-colors">Tienda</Link>
          <Link href="/nosotros" className="hover:text-[#1e293b] transition-colors">Nosotros</Link>
          <Link href="/contacto" className="hover:text-[#1e293b] transition-colors">Contacto</Link>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            aria-label="Cuenta de usuario"
          >
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
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-lg shadow-lg py-2 z-50">
              <button className="w-full text-left px-4 py-2 text-sm text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
                Mi cuenta
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-[#64748b] hover:bg-[#f1f5f9] transition-colors">
                Cerrar sesión
              </button>
            </div>
          )}

          <Link
            href="/turnos"
            className="bg-[#1e293b] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors"
          >
            Pedir turno
          </Link>

          {/* Carrito */}
          <button
            className="relative w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            aria-label="Carrito de compras"
          >
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
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 110 4 2 2 0 010-4z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] text-[10px] text-white flex items-center justify-center font-bold">
              0
            </span>
          </button>

          {/* Menú móvil */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            aria-label="Menú"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#e2e8f0] bg-white py-4">
          <Link
            href="/"
            className="block px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9]"
          >
            Inicio
          </Link>
          <Link
            href="/catalogo"
            className="block px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9]"
          >
            Tienda
          </Link>
          <Link
            href="/nosotros"
            className="block px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9]"
          >
            Nosotros
          </Link>
          <Link
            href="/contacto"
            className="block px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9]"
          >
            Contacto
          </Link>
          <Link
            href="/turnos"
            className="block px-4 py-2 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] font-bold"
          >
            Pedir turno
          </Link>
        </div>
      )}
    </nav>
  );
}
