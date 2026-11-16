import { getPerfilActual } from "@/core/services/auth.service";
import { PerfilPropioPanel } from "@/components/empleado/perfil-propio-panel";
import type { Perfil } from "@/types/database.types";

export const metadata = { title: "Mi perfil · Empleado — Veterinaria Palma" };

export default async function EmpleadoPerfilPage() {
  const { perfil } = await getPerfilActual();
  return <PerfilPropioPanel perfilActual={(perfil ?? null) as Perfil | null} />;
}
