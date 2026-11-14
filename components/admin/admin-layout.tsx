"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/core/actions/auth.action";

interface ItemMenu {
  href: string;
  label: string;
}

interface SeccionMenu {
  titulo: string;
  items: ItemMenu[];
}

const SECCIONES: SeccionMenu[] = [
  {
    titulo: "Principal",
    items: [
      { href: "/admin/dashboard", label: "Dashboard" },
      { href: "/admin/ventas", label: "Ventas" },
      { href: "/admin/turnos", label: "Turnos" },
      { href: "/admin/catalogo", label: "Catálogo" },
      { href: "/admin/inventario", label: "Inventario" },
      { href: "/admin/pedidos", label: "Pedidos" },
    ],
  },
  {
    titulo: "Gestión",
    items: [
      { href: "/admin/proveedores", label: "Proveedores" },
      { href: "/admin/precios", label: "Precios" },
      { href: "/admin/pagos-envios", label: "Pagos y envíos" },
    ],
  },
  {
    titulo: "Sistema",
    items: [
      { href: "/admin/sesiones", label: "Sesiones" },
      { href: "/admin/perfil", label: "Perfil/Ajustes" },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside
        className={`w-64 border-r border-[#e2e8f0] bg-white flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center text-[10px] text-white">
              P
            </div>
            <span className="font-bold text-[#1e293b] tracking-tight">Admin Palma</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-5 overflow-auto">
          {SECCIONES.map((seccion) => (
            <div key={seccion.titulo}>
              <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                {seccion.titulo}
              </div>
              <div className="space-y-1">
                {seccion.items.map((item) => {
                  const activo = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activo
                          ? "bg-[#1e293b] text-white"
                          : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header admin */}
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
            <h1 className="text-lg font-bold text-[#1e293b]">Panel de Administración</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
