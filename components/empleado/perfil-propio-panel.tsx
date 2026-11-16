"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { actualizarPerfilPropio } from "@/core/actions/perfil.action";
import { FormFeedback } from "@/components/ui/alert";
import type { Perfil } from "@/types/database.types";

const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background";

/**
 * Perfil del empleado: solo sus datos personales (nombre, apellido,
 * teléfono y foto). El email queda en solo lectura (el trigger
 * proteger_campos_perfil lo bloquea). Tienda, notificaciones y equipo
 * son exclusivos del admin.
 */
export function PerfilPropioPanel({ perfilActual }: { perfilActual: Perfil | null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: perfilActual?.nombre ?? "",
    apellido: perfilActual?.apellido ?? "",
    telefono: perfilActual?.telefono ?? "",
    fotoUrl: perfilActual?.foto_url ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    const resultado = await actualizarPerfilPropio({
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono || undefined,
      fotoUrl: form.fotoUrl,
    });
    setGuardando(false);
    setMensaje(
      resultado.ok
        ? { tipo: "exito", texto: "Perfil actualizado" }
        : { tipo: "error", texto: resultado.error },
    );
    if (resultado.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Mi perfil</h2>
        <p className="text-muted-foreground">Tus datos personales.</p>
      </div>

      {mensaje && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      <section className="bg-card border border-border rounded-xl p-5 max-w-xl">
        <h3 className="font-semibold text-primary mb-1">Mis datos</h3>
        <p className="text-xs text-muted-foreground mb-4">
          El email no es editable desde acá (por seguridad).
        </p>
        <form onSubmit={guardar} className="space-y-3">
          <div className="flex items-center gap-4">
            <Image
              src={form.fotoUrl || "/placeholder.svg"}
              alt="Foto de perfil"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover border border-border"
            />
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">URL de la foto</label>
              <input
                type="url"
                className={inputCls}
                placeholder="https://..."
                value={form.fotoUrl}
                onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre</label>
              <input
                className={inputCls}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Apellido</label>
              <input
                className={inputCls}
                value={form.apellido}
                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                required
                minLength={2}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Teléfono</label>
            <input
              className={inputCls}
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email (solo lectura)</label>
            {/* readOnly (no disabled): los lectores de pantalla anuncian el valor */}
            <input
              className={`${inputCls} bg-muted/50 text-muted-foreground`}
              value={perfilActual?.email ?? ""}
              readOnly
              aria-label="Email (solo lectura)"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-3 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {guardando ? "Guardando..." : "Guardar perfil"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
