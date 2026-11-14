"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearTurnoPresencial } from "@/core/actions/turnos.action";
import { ESPECIALIDADES } from "@/lib/data/especialidades";
import { HORARIOS_TURNO } from "@/lib/constants";
import { AgendaView } from "@/components/admin/agenda-view";
import { EstadisticasView } from "@/components/admin/estadisticas-view";
import type { Turno } from "@/types/database.types";

export interface TurnoFila extends Turno {
  perfiles?: {
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
  } | null;
}

type Vista = "agenda" | "estadisticas";

// Slots de 30 min dentro del horario de atención (09:00 a 17:00)
function generarSlots(): string[] {
  const slots: string[] = [];
  const [h0, m0] = HORARIOS_TURNO.DESDE.split(":").map(Number);
  const [h1] = HORARIOS_TURNO.HASTA.split(":").map(Number);
  let minutos = h0 * 60 + m0;
  const fin = h1 * 60;
  while (minutos + HORARIOS_TURNO.INTERVALO_MINUTOS <= fin) {
    const h = String(Math.floor(minutos / 60)).padStart(2, "0");
    const m = String(minutos % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    minutos += HORARIOS_TURNO.INTERVALO_MINUTOS;
  }
  return slots;
}

const SLOTS = generarSlots();

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface FormPresencial {
  fecha: string;
  horaInicio: string;
  especialidad: string;
  mascotaNombre: string;
  mascotaEspecie: "perro" | "gato" | "otro";
  responsableNombre: string;
  responsableTelefono: string;
  motivo: string;
}

const FORM_INICIAL: FormPresencial = {
  fecha: hoyISO(),
  horaInicio: SLOTS[0],
  especialidad: ESPECIALIDADES[0].nombre,
  mascotaNombre: "",
  mascotaEspecie: "perro",
  responsableNombre: "",
  responsableTelefono: "",
  motivo: "",
};

export function TurnosPanel({ turnos }: { turnos: TurnoFila[] }) {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("agenda");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<FormPresencial>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const especialidadElegida = ESPECIALIDADES.find(
    (e) => e.nombre === form.especialidad,
  );
  const duracion = especialidadElegida?.duracion ?? HORARIOS_TURNO.INTERVALO_MINUTOS;

  function horaFinCalculada(horaInicio: string): string {
    const [h, m] = horaInicio.split(":").map(Number);
    const total = h * 60 + m + duracion;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function cerrarModal() {
    setModalAbierto(false);
    setForm(FORM_INICIAL);
    setError(null);
  }

  async function guardarTurno(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);

    const resultado = await crearTurnoPresencial({
      fecha: form.fecha,
      horaInicio: form.horaInicio,
      horaFin: horaFinCalculada(form.horaInicio),
      especialidad: form.especialidad,
      mascotaNombre: form.mascotaNombre || undefined,
      mascotaEspecie: form.mascotaEspecie,
      responsableNombre: form.responsableNombre,
      responsableTelefono: form.responsableTelefono || undefined,
      motivo: form.motivo || undefined,
    });

    setGuardando(false);

    if (resultado.ok) {
      setMensaje("Turno registrado correctamente");
      cerrarModal();
      router.refresh();
    } else {
      setError(resultado.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Título + tabs + botón nuevo turno */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Turnos veterinarios</h2>
          <p className="text-[#64748b]">Agenda y estadísticas de los turnos de la clínica.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[#e2e8f0] bg-white overflow-hidden">
            <button
              onClick={() => setVista("agenda")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                vista === "agenda"
                  ? "bg-[#1e293b] text-white"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setVista("estadisticas")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                vista === "estadisticas"
                  ? "bg-[#1e293b] text-white"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              Estadísticas
            </button>
          </div>
          <button
            onClick={() => {
              setMensaje(null);
              setModalAbierto(true);
            }}
            className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] transition-colors font-medium"
          >
            + Nuevo turno
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}

      {vista === "agenda" ? (
        <AgendaView turnos={turnos} />
      ) : (
        <EstadisticasView turnos={turnos} />
      )}

      {/* Modal: nuevo turno presencial */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-bold text-[#1e293b] mb-1">Nuevo turno (presencial)</h3>
            <p className="text-sm text-[#64748b] mb-4">
              Atención en el local, sin cuenta de cliente.
            </p>
            {error && (
              <div className="p-3 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca] mb-4">
                {error}
              </div>
            )}
            <form onSubmit={guardarTurno} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Fecha</label>
                  <input
                    type="date"
                    min={hoyISO()}
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">
                    Hora ({horaFinCalculada(form.horaInicio)} fin, {duracion} min)
                  </label>
                  <select
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                    required
                  >
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Especialidad</label>
                <select
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                  value={form.especialidad}
                  onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                  required
                >
                  {ESPECIALIDADES.map((e) => (
                    <option key={e.id} value={e.nombre}>
                      {e.nombre} — {e.profesional}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Mascota</label>
                  <input
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    placeholder="Nombre de la mascota"
                    value={form.mascotaNombre}
                    onChange={(e) => setForm({ ...form, mascotaNombre: e.target.value })}
                    maxLength={80}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Especie</label>
                  <select
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    value={form.mascotaEspecie}
                    onChange={(e) =>
                      setForm({ ...form, mascotaEspecie: e.target.value as FormPresencial["mascotaEspecie"] })
                    }
                    required
                  >
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">
                    Responsable <span className="text-[#991b1b]">*</span>
                  </label>
                  <input
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    placeholder="Nombre del dueño"
                    value={form.responsableNombre}
                    onChange={(e) => setForm({ ...form, responsableNombre: e.target.value })}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1">Teléfono (opcional)</label>
                  <input
                    className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                    placeholder="Teléfono"
                    value={form.responsableTelefono}
                    onChange={(e) => setForm({ ...form, responsableTelefono: e.target.value })}
                    maxLength={30}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748b] mb-1">Motivo</label>
                <textarea
                  className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm"
                  placeholder="Control, consulta, vacunación..."
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  maxLength={300}
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-sm border border-[#e2e8f0] rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-sm bg-[#1e293b] text-white rounded-lg hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
                >
                  {guardando ? "Guardando..." : "Registrar turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
