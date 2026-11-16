import { getPerfilActual } from "@/core/services/auth.service";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";

export default async function AdminLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protección de ruta: solo administradores pueden acceder a /admin/*.
  // Anónimo → /login (el modal de auth levanta ahí); logueado sin rol admin →
  // /cuenta con aviso, en vez de /login?error=... que parecía "login roto".
  const { perfil } = await getPerfilActual();

  if (!perfil) {
    redirect("/login");
  }

  if (perfil.rol !== "admin") {
    redirect("/cuenta?aviso=sin-permisos");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
