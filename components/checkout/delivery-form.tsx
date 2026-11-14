"use client";

import { useState } from "react";
import { METODOS_ENTREGA } from "@/lib/constants";
import { formatearMoneda } from "@/lib/utils";
import {
  calcularCostoEnvio,
  requiereDireccionEnvio,
} from "@/core/services/envios.service";
import type { MetodoEntrega, ZonaEnvio } from "@/types/database.types";

const OPCIONES: { metodo: MetodoEntrega; label: string }[] = [
  { metodo: METODOS_ENTREGA.RETIRO_TIENDA, label: "Retiro en tienda" },
  { metodo: METODOS_ENTREGA.ENVIO_LOCAL, label: "Envío local (ciudad)" },
  { metodo: METODOS_ENTREGA.ENVIO_PROVINCIAL, label: "Envío provincial" },
];

interface DeliveryFormProps {
  zonas: ZonaEnvio[];
  subtotal: number;
  onChange: (datos: {
    metodo: MetodoEntrega;
    direccion: string;
    costoEnvio: number;
    total: number;
  }) => void;
}

export function DeliveryForm({ zonas, subtotal, onChange }: DeliveryFormProps) {
  const [metodo, setMetodo] = useState<MetodoEntrega>(
    METODOS_ENTREGA.RETIRO_TIENDA
  );
  const [direccion, setDireccion] = useState<string>("");

  const { costo } = calcularCostoEnvio({ metodo, zonas });
  const total = subtotal + costo;
  const requiereDireccion = requiereDireccionEnvio(metodo);

  function seleccionar(nuevoMetodo: MetodoEntrega) {
    setMetodo(nuevoMetodo);
    setDireccion("");
    const nuevoCosto = calcularCostoEnvio({ metodo: nuevoMetodo, zonas }).costo;
    onChange({
      metodo: nuevoMetodo,
      direccion: "",
      costoEnvio: nuevoCosto,
      total: subtotal + nuevoCosto,
    });
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-bold text-[#1e293b]">Método de entrega</h3>

      <div className="space-y-3">
        {OPCIONES.map((op) => {
          const seleccionado = metodo === op.metodo;
          const costoOp = calcularCostoEnvio({ metodo: op.metodo, zonas }).costo;
          return (
            <button
              key={op.metodo}
              type="button"
              onClick={() => seleccionar(op.metodo)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                seleccionado
                  ? "bg-[#1e293b] text-white border-[#1e293b]"
                  : "bg-[#f8fafc] border-[#e2e8f0] hover:border-[#cbd5e1]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-5 h-5 ${
                  seleccionado ? "text-white" : "text-[#64748b]"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
                  className={`font-medium ${
                    seleccionado ? "text-white" : "text-[#1e293b]"
                  }`}
                >
                  {op.label}
                </div>
                <div
                  className={`text-xs ${
                    seleccionado ? "text-[#94a3b8]" : "text-[#64748b]"
                  }`}
                >
                  {op.metodo === METODOS_ENTREGA.RETIRO_TIENDA
                    ? "Gratis"
                    : formatearMoneda(costoOp)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {requiereDireccion && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#64748b]">
            Dirección de envío
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => {
              setDireccion(e.target.value);
              onChange({
                metodo,
                direccion: e.target.value,
                costoEnvio: costo,
                total,
              });
            }}
            placeholder="Calle y número"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
          />
        </div>
      )}
    </div>
  );
}
