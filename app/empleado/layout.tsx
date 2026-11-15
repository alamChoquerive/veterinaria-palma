import { verificarRolEn } from "@/core/services/auth.service";
import { redirect } from "next/navigation";
import { EmpleadoLayout } from "@/components/empleado/empleado-layout";

export default async function EmpleadoLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // Panel del empleado: lo ven el rol empleado y el admin (el jefe)
  const { autorizado, error } = await verificarRolEn(["empleado", "admin"]);

  if (!autorizado) {
    redirect("/login?error=" + encodeURIComponent(error ?? "Acceso denegado"));
  }

  return <EmpleadoLayout>{children}</EmpleadoLayout>;
}
