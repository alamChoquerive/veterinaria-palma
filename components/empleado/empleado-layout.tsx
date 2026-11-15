"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/core/actions/auth.action";

const MENU = [
  { href: "/empleado/dashboard", label: "Dashboard" },
  { href: "/empleado/pos", label: "Venta presencial" },
  { href: "/empleado/turnos", label: "Turnos" },
  { href: "/empleado/catalogo", label: "Catálogo" },
  { href: "/empleado/inventario", label: "Inventario" },
  { href: "/empleado/pedidos", label: "Pedidos" },
  { href: "/empleado/perfil", label: "Perfil" },
];

export function EmpleadoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      <aside
        className={`w-64 border-r border-[#e2e8f0] bg-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0e7490] flex items-center justify-center text-[10px] text-white">
              P
            </div>
            <span className="font-bold text-[#1e293b] tracking-tight">Panel Empleado</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-auto">
          {MENU.map((item) => {
            const activo = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activo
                    ? "bg-[#0e7490] text-white"
                    : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#e2e8f0]">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-[#fee2e2] transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-[#e2e8f0] bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
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
            <h1 className="text-lg font-bold text-[#1e293b]">Panel del Empleado</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
