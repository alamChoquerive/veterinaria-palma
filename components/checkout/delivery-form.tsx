"use client";

import { useState } from "react";
import { METODOS_ENTREGA, ZONAS_ENVIO } from "@/lib/constants";
import { formatearMoneda } from "@/lib/utils";
import { calcularCostoEnvio } from "@/core/services/envios.service";
import type { ZonaEnvio } from "@/types/database.types";

interface DeliveryFormProps {
  zonas: ZonaEnvio[];
  subtotal: number;
  onChange: (datos: {
    metodo: string;
    direccion: string;
    costoEnvio: number;
    total: number;
  }) => void;
}

export function DeliveryForm({
  zonas,
  subtotal,
  onChange,
}: DeliveryFormProps) {
  const [metodo, setMetodo] = useState<string>("retiro_tienda");
  const [direccion, setDireccion] = useState<string>("");

  const { costo } = calcularCostoEnvio({ metodo, zonas });
  const total = subtotal + costo;
  const requiereDireccion = metodo !== "retiro_tienda";

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-bold text-[#1e293b]">Método de entrega</h3>

      <div className="space-y-3">
        {zonas.map((zona) => {
          const seleccionado = zona.id === metodo || zona.nombre === metodo;
          return (
            <button
              key={zona.id}
              onClick={() => {
                setMetodo(zona.id ?? zona.nombre);
                setDireccion("");
                onChange({
                  metodo: zona.id ?? zona.nombre,
                  direccion: "",
                  costoEnvio: zona.costo,
                  total: subtotal + zona.costo,
                });
              }}
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
                <div className={`font-medium ${
                  seleccionado ? "text-white" : "text-[#1e293b]"
                }`}>{zona.nombre}</div>
                <div className={`text-xs ${
                  seleccionado ? "text-[#94a3b8]" : "text-[#64748b]"
                }`}>
                  {formatearMoneda(zona.costo)}
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
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle y número"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b]"
          />
          <button
            onClick={() =>
              onChange({
                metodo,
                direccion,
                costoEnvio: costo,
                total,
              })
            }
            className="px-4 py-2 text-sm font-medium text-[#1e293b] hover:text-[#0f172a]"
          >
            Confirmar dirección
          </button>
        </div>
      )}
    </div>
  );
}
