"use client";

import { METODOS_ENTREGA } from "@/lib/constants";
import { formatearMoneda } from "@/lib/utils";
import {
  calcularCostoEnvio,
  requiereDireccionEnvio,
} from "@/core/services/envios.service";
import { Input } from "@/components/ui/input";
import type { MetodoEntrega, ZonaEnvio } from "@/types/database.types";

const OPCIONES: { metodo: MetodoEntrega; label: string }[] = [
  { metodo: METODOS_ENTREGA.RETIRO_TIENDA, label: "Retiro en tienda" },
  { metodo: METODOS_ENTREGA.ENVIO_LOCAL, label: "Envío local (ciudad)" },
  { metodo: METODOS_ENTREGA.ENVIO_PROVINCIAL, label: "Envío provincial" },
];

interface DeliveryFormProps {
  zonas: ZonaEnvio[];
  subtotal: number;
  metodo: MetodoEntrega;
  direccion: string;
  onChange: (datos: {
    metodo: MetodoEntrega;
    direccion: string;
    costoEnvio: number;
    total: number;
  }) => void;
}

/**
 * Formulario de entrega CONTROLADO: el estado vive en CheckoutFlow (una sola
 * fuente) y acá solo se emite onChange. Así no hay estado duplicado metodo/direccion.
 */
export function DeliveryForm({
  zonas,
  subtotal,
  metodo,
  direccion,
  onChange,
}: DeliveryFormProps) {
  const { costo, zona } = calcularCostoEnvio({ metodo, zonas });
  const requiereDireccion = requiereDireccionEnvio(metodo);
  const envioOK = metodo === "retiro_tienda" || Boolean(zona);

  function seleccionar(nuevoMetodo: MetodoEntrega) {
    const nuevo = calcularCostoEnvio({ metodo: nuevoMetodo, zonas });
    onChange({
      metodo: nuevoMetodo,
      direccion: "",
      costoEnvio: nuevo.costo,
      total: subtotal + nuevo.costo,
    });
  }

  const foco =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="bg-white border border-border rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-bold text-primary">Método de entrega</h3>

      <div className="space-y-3" role="group" aria-label="Método de entrega">
        {OPCIONES.map((op) => {
          const seleccionado = metodo === op.metodo;
          const { costo: costoOp, zona: zonaOp } = calcularCostoEnvio({
            metodo: op.metodo,
            zonas,
          });
          const sinZona = op.metodo !== METODOS_ENTREGA.RETIRO_TIENDA && !zonaOp;
          return (
            <button
              key={op.metodo}
              type="button"
              aria-pressed={seleccionado}
              onClick={() => seleccionar(op.metodo)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${foco} ${
                seleccionado
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted border-border hover:border-[#cbd5e1]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 ${seleccionado ? "text-primary-foreground" : "text-muted-foreground"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <div
                  className={`font-medium ${seleccionado ? "text-primary-foreground" : "text-primary"}`}
                >
                  {op.label}
                </div>
                <div
                  className={`text-xs ${seleccionado ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {op.metodo === METODOS_ENTREGA.RETIRO_TIENDA
                    ? "Gratis"
                    : sinZona
                      ? "Sin envío configurado"
                      : formatearMoneda(costoOp)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {requiereDireccion && (
        <div className="space-y-2">
          <label htmlFor="direccion-envio" className="block text-sm font-medium text-muted-foreground">
            Dirección de envío
          </label>
          <Input
            id="direccion-envio"
            type="text"
            value={direccion}
            onChange={(e) => {
              onChange({ metodo, direccion: e.target.value, costoEnvio: costo, total: subtotal + costo });
            }}
            placeholder="Calle y número"
            required
            aria-required="true"
            aria-invalid={!envioOK || undefined}
            autoComplete="street-address"
          />
          {!envioOK && (
            <p className="text-xs text-[#991b1b]" role="alert">
              Este método de envío no tiene zona activa configurada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
