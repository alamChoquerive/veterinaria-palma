"use client";

import Link from "next/link";
import { useState } from "react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menu = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/admin/inventario", label: "Inventario", icon: "📦" },
    { href: "/admin/agenda", label: "Agenda de turnos", icon: "📅" },
  ];

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
        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#e2e8f0]">
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-[#fee2e2] transition-colors"
          >
            <span className="text-lg">🚪</span>
            Cerrar sesión
          </button>
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
          <div className="flex items-center gap-3">
            <button
              className="w-8 h-8 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
              aria-label="Cuenta"
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
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
