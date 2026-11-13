"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { crearPreferenciaPago } from "@/core/actions/pago.action";

interface MercadoPagoButtonProps {
  pedidoId: string;
  total: number;
  descripcion: string;
  onPagoExitoso: () => void;
}

export function MercadoPagoButton({
  pedidoId,
  total,
  descripcion,
  onPagoExitoso,
}: MercadoPagoButtonProps) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePago() {
    setProcesando(true);
    setError(null);

    const resultado = await crearPreferenciaPago({
      pedidoId,
      total,
      descripcion: "Compra en Veterinaria Palma - Pedido #" + pedidoId.slice(0, 8),
    });

    setProcesando(false);

    if (
      "ok" in resultado &&
      resultado.ok &&
      resultado.data &&
      typeof resultado.data === "object" &&
      "initPoint" in resultado.data
    ) {
      window.location.href = (resultado.data as { initPoint: string }).initPoint;
    } else {
      setError(
        "ok" in resultado && !resultado.ok
          ? resultado.error
          : "Error al iniciar el pago"
      );
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded bg-[#fee2e2] text-[#991b1b] text-sm border border-[#fecaca]">
          {error}
        </div>
      )}
      <Button
        onClick={handlePago}
        disabled={procesando}
        className="w-full py-3 bg-[#1e293b] text-white font-medium hover:bg-[#0f172a] disabled:opacity-50 transition-colors"
      >
        {procesando ? "Procesando pago..." : "Pagar con Mercado Pago"}
      </Button>
    </div>
  );
}
