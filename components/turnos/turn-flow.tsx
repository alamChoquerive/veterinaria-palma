"use client";

import { useState } from "react";
import Link from "next/link";
import { crearTurno } from "@/core/actions/turnos.action";
import type { EspecieMascota } from "@/core/actions/schemas";
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
  mascotaEspecie: EspecieMascota | "";
  mascotaRaza: string;
  mascotaEdad: string;
  responsableNombre: string;
  responsableTelefono: string;
  motivo: string;
}

type ErroresDatos = Partial<Record<keyof DatosFormulario, string>>;

const DATOS_INICIALES: DatosFormulario = {
  mascotaNombre: "",
  mascotaEspecie: "",
  mascotaRaza: "",
  mascotaEdad: "",
  responsableNombre: "",
  responsableTelefono: "",
  motivo: "",
};

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const cta = `bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${foco}`;
const secundario = `text-muted-foreground hover:text-primary transition-colors ${foco}`;

function validarDatos(d: DatosFormulario): ErroresDatos {
  const errores: ErroresDatos = {};
  if (d.mascotaNombre.trim().length < 2) {
    errores.mascotaNombre = "Ingresá el nombre de la mascota";
  }
  if (!["perro", "gato", "otro"].includes(d.mascotaEspecie)) {
    errores.mascotaEspecie = "Elegí la especie";
  }
  if (d.responsableNombre.trim().length < 2) {
    errores.responsableNombre = "Ingresá tu nombre completo";
  }
  if (!/^[\d\s()+-]{8,30}$/.test(d.responsableTelefono.trim())) {
    errores.responsableTelefono = "Ingresá un teléfono válido";
  }
  return errores;
}

export function TurnFlow({ autenticado }: { autenticado: boolean }) {
  const [paso, setPaso] = useState(1);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<Especialidad | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosFormulario>(DATOS_INICIALES);
  const [erroresDatos, setErroresDatos] = useState<ErroresDatos>({});
  const [enviando, setEnviando] = useState(false);
  const [turnoCreado, setTurnoCreado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disponibilidadKey, setDisponibilidadKey] = useState(0);

  const especialidad = ESPECIALIDADES.find((e) => e.id === especialidadSeleccionada?.id) ?? undefined;

  const cambiarPaso = (nuevoPaso: number) => {
    setPaso(nuevoPaso);
  };

  const manejarCrearTurno = async () => {
    if (!especialidad || !fechaSeleccionada || !horaSeleccionada) return;
    setEnviando(true);
    setError(null);

    const horaFin = new Date(`1970-01-01T${horaSeleccionada}:00`);
    horaFin.setMinutes(horaFin.getMinutes() + (especialidad.duracion ?? 30));
    const horaFinStr = horaFin.toTimeString().slice(0, 5);

    const resultado = await crearTurno({
      fecha: fechaSeleccionada,
      horaInicio: horaSeleccionada,
      horaFin: horaFinStr,
      motivo: datos.motivo || undefined,
      especialidad: especialidad.nombre,
      mascotaNombre: datos.mascotaNombre,
      // validarDatos() garantiza que en este punto es un enum válido
      mascotaEspecie: datos.mascotaEspecie as EspecieMascota,
      responsableNombre: datos.responsableNombre,
      responsableTelefono: datos.responsableTelefono,
    });

    setEnviando(false);

    if (resultado.ok) {
      setTurnoCreado(true);
    } else {
      const mensaje = resultado.error || "No se pudo crear el turno";
      setError(mensaje);
      // Si el slot se ocupó entre que se eligió y se confirmó, volvemos al
      // paso 2 y reconsultamos disponibilidad en vez de quedarnos en el error.
      if (/ocupado|solap|reservado/i.test(mensaje)) {
        setPaso(2);
        setDisponibilidadKey((k) => k + 1);
      }
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
            setErroresDatos({});
            setError(null);
          }}
        />
      </div>
    );
  }

  const resumenSeleccion = especialidad
    ? `${especialidad.nombre} · ${fechaSeleccionada ? formatearFecha(fechaSeleccionada) : "fecha"} · ${horaSeleccionada ?? "hora"} · ${especialidad.duracion ?? 30} min`
    : null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {!autenticado && (
        <div
          className="mb-6 p-3 rounded-lg bg-[#fef3c7] text-[#92400e] text-sm border border-[#fde68a] flex flex-col sm:flex-row sm:items-center gap-3"
          role="status"
        >
          <span>Para confirmar el turno necesitás iniciar sesión.</span>
          <Link
            href="/login?redirect=/turnos"
            className={`underline font-medium ${foco}`}
          >
            Iniciar sesión
          </Link>
        </div>
      )}

      <StepIndicator
        pasoActual={paso}
        onIrPaso={(n) => {
          if (n < paso) setPaso(n);
        }}
      />

      {paso >= 2 && resumenSeleccion && (
        <p className="mb-6 text-center text-sm text-muted-foreground" aria-live="polite">
          {resumenSeleccion}
        </p>
      )}

      {paso === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Seleccioná una especialidad</h2>
          <EspecialidadSelector
            especialidades={ESPECIALIDADES}
            seleccionada={especialidadSeleccionada}
            onSeleccionar={(id) => {
              const esp = ESPECIALIDADES.find((e) => e.id === id);
              setEspecialidadSeleccionada(esp ?? null);
              // cambiar de especialidad invalida fecha/hora elegidas antes
              setFechaSeleccionada(null);
              setHoraSeleccionada(null);
            }}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (especialidadSeleccionada) cambiarPaso(2);
              }}
              disabled={!especialidadSeleccionada}
              className={`px-6 py-2 rounded-lg text-sm font-medium ${cta}`}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Fecha y hora</h2>
          <FechaHoraSelector
            especialidad={especialidad ?? ESPECIALIDADES[0]}
            fechaSeleccionada={fechaSeleccionada}
            horaSeleccionada={horaSeleccionada}
            disponibilidadKey={disponibilidadKey}
            onSeleccionarFecha={(f) => {
              if (f !== fechaSeleccionada) {
                setFechaSeleccionada(f);
                setHoraSeleccionada(null);
              }
            }}
            onSeleccionarHora={setHoraSeleccionada}
          />
          <div className="flex justify-between">
            <button type="button" onClick={() => cambiarPaso(1)} className={`px-6 py-2 text-sm ${secundario}`}>
              ← Volver
            </button>
            <button
              type="button"
              onClick={() => {
                if (fechaSeleccionada && horaSeleccionada) cambiarPaso(3);
              }}
              disabled={!fechaSeleccionada || !horaSeleccionada}
              className={`px-6 py-2 rounded-lg text-sm font-medium ${cta}`}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

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
            motivo={datos.motivo}
            errores={erroresDatos}
            onChange={(campo, valor) => {
              setDatos((prev) => ({ ...prev, [campo]: valor }));
              setErroresDatos((prev) => ({ ...prev, [campo]: undefined }));
            }}
          />
          <div className="flex justify-between">
            <button type="button" onClick={() => cambiarPaso(2)} className={`px-6 py-2 text-sm ${secundario}`}>
              ← Volver
            </button>
            <button
              type="button"
              onClick={() => {
                const errores = validarDatos(datos);
                setErroresDatos(errores);
                if (Object.values(errores).some(Boolean)) {
                  setError("Revisá los campos marcados antes de continuar.");
                  return;
                }
                setError(null);
                cambiarPaso(4);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-medium ${cta}`}
            >
              Revisar →
            </button>
          </div>
        </div>
      )}

      {paso === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Confirmar turno</h2>
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca]"
            >
              {error}
            </div>
          )}
          <div className="bg-muted border border-border rounded-xl p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Especialidad</span>
              <span className="font-medium">{especialidad?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Veterinario</span>
              <span className="font-medium">{especialidad?.profesional}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">{formatearFecha(fechaSeleccionada ?? "")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hora</span>
              <span className="font-medium">{horaSeleccionada}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duración</span>
              <span className="font-medium">{especialidad?.duracion} min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mascota</span>
              <span className="font-medium">{datos.mascotaNombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Responsable</span>
              <span className="font-medium">{datos.responsableNombre}</span>
            </div>
          </div>
          <div className="flex justify-between gap-3">
            <button type="button" onClick={() => cambiarPaso(3)} className={`px-6 py-2 text-sm ${secundario}`}>
              ← Volver
            </button>
            {autenticado ? (
              <button
                type="button"
                onClick={manejarCrearTurno}
                disabled={enviando}
                className={`px-6 py-2 rounded-lg text-sm font-medium ${cta}`}
              >
                {enviando ? "Guardando..." : "Confirmar turno"}
              </button>
            ) : (
              <Link
                href="/login?redirect=/turnos"
                className={`px-6 py-2 rounded-lg text-sm font-medium ${cta}`}
              >
                Iniciar sesión para confirmar
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
