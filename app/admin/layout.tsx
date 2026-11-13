import { verificarRol } from "@/core/services/auth.service";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";

export default async function AdminLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protección de ruta: solo administradores pueden acceder a /admin/*
  const { autorizado, error } = await verificarRol("admin");

  if (!autorizado) {
    redirect("/login?error=" + encodeURIComponent(error ?? "Acceso denegado"));
  }

  return <AdminLayout>{children}</AdminLayout>;
}
