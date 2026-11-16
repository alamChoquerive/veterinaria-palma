import { createClient } from "@/core/supabase/server";
import { createAdminClient } from "@/core/supabase/admin";
import { ETIQUETA_ROL } from "@/lib/constants";
import type { LogAcceso, Perfil } from "@/types/database.types";

const VENTANA_ACTIVO_HORAS = 24;

function formatearFechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const COLOR_ROL: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  empleado: "bg-[#dbeafe] text-[#1e40af]",
  mayorista: "bg-[#fef3c7] text-[#92400e]",
  minorista: "bg-muted text-muted-foreground",
};

export const metadata = { title: "Sesiones · Admin — Veterinaria Palma" };

export default async function AdminSesionesPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Sesiones de auth (service_role) + perfiles del staff (admin/empleado)
  const [usuariosAuth, perfiles, logs] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabase.from("perfiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("logs_acceso")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const mapaPerfiles = new Map((perfiles.data ?? []).map((p) => [p.id, p as Perfil]));

  // Solo nos interesan las sesiones del jefe y los empleados
  const staff = (usuariosAuth.data?.users ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      ultimoAcceso: u.last_sign_in_at ?? null,
      creado: u.created_at,
      perfil: mapaPerfiles.get(u.id) ?? null,
    }))
    .filter((u) => u.perfil && (u.perfil.rol === "admin" || u.perfil.rol === "empleado"))
    .sort((a, b) => (b.ultimoAcceso ?? "").localeCompare(a.ultimoAcceso ?? ""));

  // Referencia de tiempo fija para esta renderización (componente puro)
  const ahora = new Date().getTime();
  const logsAcceso = (logs.data ?? []) as LogAcceso[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Sesiones</h2>
        <p className="text-muted-foreground">
          Quién está conectado al sistema (jefe y empleados) y los accesos recientes.
        </p>
      </div>

      {/* Sesiones activas del staff */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-primary mb-4">
          Staff conectado (últimas {VENTANA_ACTIVO_HORAS} h)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Rol</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Último acceso</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {staff.length > 0 ? (
                staff.map((u) => {
                  const activo =
                    u.ultimoAcceso !== null &&
                    ahora - new Date(u.ultimoAcceso).getTime() <=
                      VENTANA_ACTIVO_HORAS * 3600 * 1000;
                  return (
                    <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">
                        {u.perfil
                          ? `${u.perfil.nombre ?? ""} ${u.perfil.apellido ?? ""}`.trim() || "—"
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ROL[u.perfil?.rol ?? ""] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {ETIQUETA_ROL[u.perfil?.rol ?? ""] ?? u.perfil?.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {u.ultimoAcceso ? formatearFechaHora(u.ultimoAcceso) : "Nunca"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {activo ? (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#d1fae5] text-[#065f46]">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-muted text-muted-foreground">
                            Inactivo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No hay usuarios del staff
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          &ldquo;Activo&rdquo; = último inicio de sesión en las últimas {VENTANA_ACTIVO_HORAS} horas.
        </p>
      </section>

      {/* Log de accesos recientes */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-primary mb-4">Log de accesos recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Resultado</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">IP</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              {logsAcceso.length > 0 ? (
                logsAcceso.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm">{l.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          l.exito
                            ? "bg-[#d1fae5] text-[#065f46]"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {l.exito ? "Exitoso" : "Fallido"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">{l.ip ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">{formatearFechaHora(l.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Todavía no hay intentos de acceso registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
