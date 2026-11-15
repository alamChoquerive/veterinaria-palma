"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { actualizarPerfilPropio } from "@/core/actions/perfil.action";
import type { Perfil } from "@/types/database.types";

const inputCls = "w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm";

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
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setError(null);
    const resultado = await actualizarPerfilPropio({
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono || undefined,
      fotoUrl: form.fotoUrl,
    });
    setGuardando(false);
    if (resultado.ok) {
      setMensaje("Perfil actualizado");
      router.refresh();
    } else {
      setError(resultado.error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Mi perfil</h2>
        <p className="text-[#64748b]">Tus datos personales.</p>
      </div>

      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca]">
          {error}
        </div>
      )}

      <section className="bg-white border border-[#e2e8f0] rounded-xl p-5 max-w-xl">
        <h3 className="font-semibold text-[#1e293b] mb-1">Mis datos</h3>
        <p className="text-xs text-[#64748b] mb-4">
          El email no es editable desde acá (por seguridad).
        </p>
        <form onSubmit={guardar} className="space-y-3">
          <div className="flex items-center gap-4">
            <Image
              src={form.fotoUrl || "/placeholder.svg"}
              alt="Foto de perfil"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover border border-[#e2e8f0]"
            />
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#64748b] mb-1">URL de la foto</label>
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
              <label className="block text-xs font-medium text-[#64748b] mb-1">Nombre</label>
              <input
                className={inputCls}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] mb-1">Apellido</label>
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
            <label className="block text-xs font-medium text-[#64748b] mb-1">Teléfono</label>
            <input
              className={inputCls}
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Email (solo lectura)</label>
            <input
              className={`${inputCls} bg-[#f8fafc] text-[#64748b]`}
              value={perfilActual?.email ?? ""}
              disabled
              readOnly
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 text-sm bg-[#0e7490] text-white rounded-lg hover:bg-[#155e75] disabled:opacity-50 transition-colors"
            >
              {guardando ? "Guardando..." : "Guardar perfil"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
