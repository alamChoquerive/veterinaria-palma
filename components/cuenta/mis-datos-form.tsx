"use client";

import { useState } from "react";
import { actualizarPerfilPropio } from "@/core/actions/perfil.action";
import { Input } from "@/components/ui/input";

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface MisDatosFormProps {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

/**
 * Edición de los datos propios (nombre, apellido, teléfono). El email no se
 * toca acá: el trigger proteger_campos_perfil lo bloquea a propósito.
 */
export function MisDatosForm({ nombre, apellido, telefono, email }: MisDatosFormProps) {
  const [estado, setEstado] = useState<"idle" | "guardando" | "ok" | "error">("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstado("guardando");
    setMensaje(null);
    const formData = new FormData(e.currentTarget);
    const resultado = await actualizarPerfilPropio({
      nombre: String(formData.get("nombre") ?? ""),
      apellido: String(formData.get("apellido") ?? ""),
      telefono: String(formData.get("telefono") ?? ""),
    });
    if (resultado.ok) {
      setEstado("ok");
      setMensaje("Datos guardados.");
    } else {
      setEstado("error");
      setMensaje(resultado.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="cuenta-nombre" className="block text-xs font-medium text-muted-foreground">
            Nombre
          </label>
          <Input id="cuenta-nombre" name="nombre" defaultValue={nombre} required minLength={2} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cuenta-apellido" className="block text-xs font-medium text-muted-foreground">
            Apellido
          </label>
          <Input id="cuenta-apellido" name="apellido" defaultValue={apellido} required minLength={2} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cuenta-telefono" className="block text-xs font-medium text-muted-foreground">
            Teléfono
          </label>
          <Input id="cuenta-telefono" name="telefono" type="tel" defaultValue={telefono} />
        </div>
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-muted-foreground">Email</span>
          <p className="text-sm text-muted-foreground px-3 py-2 border border-border rounded-md bg-muted/40">
            {email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={estado === "guardando"}
          className={`px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors ${foco}`}
        >
          {estado === "guardando" ? "Guardando…" : "Guardar cambios"}
        </button>
        {mensaje && (
          <p
            role="status"
            className={`text-sm ${estado === "ok" ? "text-emerald-700" : "text-[#991b1b]"}`}
          >
            {mensaje}
          </p>
        )}
      </div>
    </form>
  );
}
