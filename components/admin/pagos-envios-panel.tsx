"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleMedioPago,
  actualizarZonaEnvio,
} from "@/core/actions/pagos-envios.action";
import { formatearMoneda } from "@/lib/utils";
import { FormFeedback } from "@/components/ui/alert";
import type { MedioPago, ZonaEnvio } from "@/types/database.types";

const ETIQUETA_TIPO_ZONA: Record<string, string> = {
  local: "Local",
  provincial: "Provincial",
};

export function PagosEnviosPanel({
  medios,
  zonas,
}: {
  medios: MedioPago[];
  zonas: ZonaEnvio[];
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  // Costos editables en memoria por zona (se guardan con el botón de cada fila)
  const [costos, setCostos] = useState<Record<string, string>>(() =>
    Object.fromEntries(zonas.map((z) => [z.id, String(z.costo)])),
  );

  async function cambiarMedio(m: MedioPago, activo: boolean) {
    setCargando(true);
    setMensaje(null);
    const resultado = await toggleMedioPago({ medioPagoId: m.id, activo });
    setCargando(false);
    if (resultado.ok) {
      setMensaje({ tipo: "exito", texto: `${m.nombre} ${activo ? "habilitado" : "deshabilitado"}` });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  async function guardarZona(z: ZonaEnvio) {
    const costo = Number(costos[z.id]);
    if (isNaN(costo) || costo < 0) {
      setMensaje({ tipo: "error", texto: "Ingresá un costo válido" });
      return;
    }
    setCargando(true);
    setMensaje(null);
    const resultado = await actualizarZonaEnvio({
      zonaId: z.id,
      costo,
      activo: z.activo,
    });
    setCargando(false);
    if (resultado.ok) {
      setMensaje({ tipo: "exito", texto: `Zona "${z.nombre}" actualizada` });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  async function cambiarZonaActivo(z: ZonaEnvio, activo: boolean) {
    setCargando(true);
    setMensaje(null);
    // Solo se cambia el flag: el costo editado en memoria NO se persiste acá
    // (antes el toggle guardaba el costo sin haber tocado "Guardar")
    const resultado = await actualizarZonaEnvio({ zonaId: z.id, costo: z.costo, activo });
    setCargando(false);
    if (resultado.ok) {
      setMensaje({ tipo: "exito", texto: `Zona "${z.nombre}" ${activo ? "habilitada" : "deshabilitada"}` });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  return (
    <div className="space-y-6">
      {mensaje && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      {/* Medios de pago */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-primary mb-1">Medios de pago</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Elegí qué medios de pago quedan habilitados para los clientes.
        </p>
        <div className="space-y-2">
          {medios.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
            >
              <div>
                <div className="font-medium text-sm text-primary">{m.nombre}</div>
                <div className="text-xs text-muted-foreground">{m.clave}</div>
              </div>
              <button
                onClick={() => cambiarMedio(m, !m.activo)}
                disabled={cargando}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                  m.activo
                    ? "bg-[#d1fae5] text-[#065f46] hover:bg-destructive/20 hover:text-destructive"
                    : "bg-muted text-muted-foreground hover:bg-[#d1fae5] hover:text-[#065f46]"
                }`}
              >
                {m.activo ? "Habilitado" : "Deshabilitado"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Opciones de envío */}
      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-primary mb-1">Opciones de envío</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Zonas de envío con su costo y si están habilitadas.
        </p>
        <div className="space-y-2">
          {zonas.map((z) => (
            <div
              key={z.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg px-4 py-3"
            >
              <div>
                <div className="font-medium text-sm text-primary">{z.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {ETIQUETA_TIPO_ZONA[z.tipo] ?? z.tipo}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={costos[z.id] ?? String(z.costo)}
                    onChange={(e) => setCostos({ ...costos, [z.id]: e.target.value })}
                    className="w-32 border border-border rounded-lg pl-7 pr-3 py-1.5 text-sm"
                    aria-label={`Costo de ${z.nombre}`}
                  />
                </div>
                <button
                  onClick={() => guardarZona(z)}
                  disabled={cargando}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => cambiarZonaActivo(z, !z.activo)}
                  disabled={cargando}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                    z.activo
                      ? "bg-[#d1fae5] text-[#065f46] hover:bg-destructive/20 hover:text-destructive"
                      : "bg-muted text-muted-foreground hover:bg-[#d1fae5] hover:text-[#065f46]"
                  }`}
                >
                  {z.activo ? "Habilitada" : "Deshabilitada"}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Costo actual de referencia: retiro en tienda {formatearMoneda(0)} — el costo de cada zona se define acá.
        </p>
      </section>
    </div>
  );
}
