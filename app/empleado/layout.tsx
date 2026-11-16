import { getPerfilActual } from "@/core/services/auth.service";
import { redirect } from "next/navigation";
import { EmpleadoLayout } from "@/components/empleado/empleado-layout";

export default async function EmpleadoLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // Panel del empleado: lo ven el rol empleado y el admin (el jefe).
  // Mismo gate que /admin: anónimo → /login; logueado sin rol de staff →
  // /cuenta?aviso=sin-permisos (antes caía en /login?error=... y parecía
  // que el login no andaba).
  const { perfil } = await getPerfilActual();

  if (!perfil) {
    redirect("/login");
  }

  if (perfil.rol !== "empleado" && perfil.rol !== "admin") {
    redirect("/cuenta?aviso=sin-permisos");
  }

  return <EmpleadoLayout>{children}</EmpleadoLayout>;
}
