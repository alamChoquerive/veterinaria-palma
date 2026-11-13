export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r p-4 bg-background">
        <h2 className="font-semibold mb-6">Admin</h2>
        <nav className="space-y-2">
          <a href="/admin/dashboard" className="text-primary">Dashboard</a>
          <a href="/admin/inventario" className="text-primary">Inventario</a>
          <a href="/admin/agenda" className="text-primary">Agenda de turnos</a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
