"use client";

import { useState } from "react";
import { crearTurno } from "@/core/actions/turnos.action";
import type { Especialidad } from "@/lib/data/especialidades";
import { ESPECIALIDADES } from "@/lib/data/especialidades";
import { StepIndicator } from "@/components/turnos/step-indicator";
import { EspecialidadSelector } from "@/components/turnos/especialidad-selector";
import { FechaHoraSelector } from "@/components/turnos/fecha-hora-selector";
import { DatosTurnoForm } from "@/components/turnos/datos-turno-form";
import { ConfirmacionTurno } from "@/components/turnos/confirmacion-turno";
import { formatearFecha } from "@/lib/utils";

interface DatosFormulario {
  mascotaNombre: string;
  mascotaEspecie: string;
  mascotaRaza: string;
  mascotaEdad: string;
  responsableNombre: string;
  responsableTelefono: string;
  responsableEmail: string;
  motivo: string;
}

const DATOS_INICIALES: DatosFormulario = {
  mascotaNombre: "",
  mascotaEspecie: "",
  mascotaRaza: "",
  mascotaEdad: "",
  responsableNombre: "",
  responsableTelefono: "",
  responsableEmail: "",
  motivo: "",
};

export function TurnFlow() {
  const [paso, setPaso] = useState(1);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<Especialidad | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosFormulario>(DATOS_INICIALES);
  const [enviando, setEnviando] = useState(false);
  const [turnoCreado, setTurnoCreado] = useState(false);

  const especialidad = ESPECIALIDADES.find((e) => e.id === especialidadSeleccionada?.id) ?? undefined;

  const cambiarPaso = (nuevoPaso: number) => {
    setPaso(nuevoPaso);
  };

  const manejarCrearTurno = async () => {
    if (!especialidad || !fechaSeleccionada || !horaSeleccionada) return;
    setEnviando(true);

    const horaFin = new Date(`1970-01-01T${horaSeleccionada}:00`);
    horaFin.setMinutes(horaFin.getMinutes() + (especialidad.duracion ?? 30));
    const horaFinStr = horaFin.toTimeString().slice(0, 5);

    const resultado = await crearTurno({
      fecha: fechaSeleccionada,
      horaInicio: horaSeleccionada,
      horaFin: horaFinStr,
      motivo: datos.motivo || undefined,
    });

    setEnviando(false);

    if (resultado.ok) {
      setTurnoCreado(true);
    } else {
      alert(resultado.error || "No se pudo crear el turno");
    }
  };

  if (turnoCreado) {
    return (
      <div className="max-w-md mx-auto py-10">
        <ConfirmacionTurno
          turno={{
            especialidad: especialidad?.nombre ?? "",
            profesional: especialidad?.profesional ?? "",
            fecha: formatearFecha(fechaSeleccionada ?? ""),
            hora: horaSeleccionada ?? "",
            duracion: especialidad?.duracion ?? 30,
            mascotaNombre: datos.mascotaNombre,
            mascotaEspecie: datos.mascotaEspecie,
            mascotaRaza: datos.mascotaRaza,
            mascotaEdad: datos.mascotaEdad,
            responsableNombre: datos.responsableNombre,
            responsableTelefono: datos.responsableTelefono,
            motivo: datos.motivo,
          }}
          onVolver={() => {
            setTurnoCreado(false);
            setPaso(1);
            setEspecialidadSeleccionada(null);
            setFechaSeleccionada(null);
            setHoraSeleccionada(null);
            setDatos(DATOS_INICIALES);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <StepIndicator pasoActual={paso} />

      {/* Paso 1: Especialidad */}
      {paso === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Seleccioná una especialidad</h2>
          <EspecialidadSelector
            especialidades={ESPECIALIDADES}
            seleccionada={especialidadSeleccionada}
            onSeleccionar={(id) => {
              const esp = ESPECIALIDADES.find((e) => e.id === id);
              setEspecialidadSeleccionada(esp ?? null);
            }}
          />
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (especialidadSeleccionada) cambiarPaso(2);
              }}
              disabled={!especialidadSeleccionada}
              className="px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f172a] transition-colors"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Fecha y hora */}
      {paso === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Fecha y hora</h2>
          <FechaHoraSelector
            especialidad={especialidad ?? ESPECIALIDADES[0]}
            fechaSeleccionada={fechaSeleccionada}
            horaSeleccionada={horaSeleccionada}
            onSeleccionarFecha={setFechaSeleccionada}
            onSeleccionarHora={setHoraSeleccionada}
          />
          <div className="flex justify-between">
            <button
              onClick={() => cambiarPaso(1)}
              className="px-6 py-2 text-sm text-[#64748b] hover:text-[#1e293b]"
            >
              ← Volver
            </button>
            <button
              onClick={() => {
                if (fechaSeleccionada && horaSeleccionada) cambiarPaso(3);
              }}
              disabled={!fechaSeleccionada || !horaSeleccionada}
              className="px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f172a] transition-colors"
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Datos */}
      {paso === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Datos del turno</h2>
          <DatosTurnoForm
            mascotaNombre={datos.mascotaNombre}
            mascotaEspecie={datos.mascotaEspecie}
            mascotaRaza={datos.mascotaRaza}
            mascotaEdad={datos.mascotaEdad}
            responsableNombre={datos.responsableNombre}
            responsableTelefono={datos.responsableTelefono}
            responsableEmail={datos.responsableEmail}
            motivo={datos.motivo}
            onChange={(campo, valor) => {
              setDatos((prev) => ({ ...prev, [campo]: valor }));
            }}
          />
          <div className="flex justify-between">
            <button
              onClick={() => cambiarPaso(2)}
              className="px-6 py-2 text-sm text-[#64748b] hover:text-[#1e293b]"
            >
              ← Volver
            </button>
            <button
              onClick={() => cambiarPaso(4)}
              className="px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium hover:bg-[#0f172a] transition-colors"
            >
              Revisar →
            </button>
          </div>
        </div>
      )}

      {/* Paso 4: Confirmación */}
      {paso === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Confirmar turno</h2>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Especialidad</span>
              <span className="font-medium">{especialidad?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Veterinario</span>
              <span className="font-medium">{especialidad?.profesional}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Fecha</span>
              <span className="font-medium">{formatearFecha(fechaSeleccionada ?? "")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Hora</span>
              <span className="font-medium">{horaSeleccionada}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Duración</span>
              <span className="font-medium">{especialidad?.duracion} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Mascota</span>
              <span className="font-medium">{datos.mascotaNombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Responsable</span>
              <span className="font-medium">{datos.responsableNombre}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => cambiarPaso(3)}
              className="px-6 py-2 text-sm text-[#64748b] hover:text-[#1e293b]"
            >
              ← Volver
            </button>
            <button
              onClick={manejarCrearTurno}
              disabled={enviando}
              className="px-6 py-2 bg-[#1e293b] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f172a] transition-colors"
            >
              {enviando ? "Guardando..." : "Confirmar turno"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
