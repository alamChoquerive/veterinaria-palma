"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * Diálogo de confirmación para acciones destructivas o masivas del panel
 * (eliminar usuario, cancelar turno/pedido, margen global sobre el catálogo).
 * Con `textoConfirmacion` obliga a tipear la palabra exacta (anti misclic).
 */
export function ConfirmDialog({
  titulo,
  descripcion,
  textoConfirmacion,
  etiquetaConfirmar = "Confirmar",
  cargando,
  onConfirmar,
  onCerrar,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  /** Si se define, el botón de confirmar queda bloqueado hasta tipearla. */
  textoConfirmacion?: string;
  etiquetaConfirmar?: string;
  cargando: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  const [tipeado, setTipeado] = useState("");
  const coincide = !textoConfirmacion || tipeado === textoConfirmacion;

  return (
    <Modal titulo={titulo} onCerrar={onCerrar} ancho="max-w-md">
      {descripcion && <div className="text-sm text-muted-foreground mb-4">{descripcion}</div>}
      {textoConfirmacion && (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            Escribí{" "}
            <span className="font-mono font-bold text-destructive">{textoConfirmacion}</span>{" "}
            para confirmar:
          </p>
          <input
            value={tipeado}
            onChange={(e) => setTipeado(e.target.value)}
            aria-label={`Escribí ${textoConfirmacion} para confirmar`}
            autoComplete="off"
            className={`w-full border border-border rounded-lg px-3 py-2 text-sm mb-4 bg-background ${foco}`}
          />
        </>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCerrar}
          disabled={cargando}
          className={`px-4 py-2.5 text-sm border border-border rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 ${foco}`}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          disabled={cargando || !coincide}
          className={`px-4 py-2.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 ${foco}`}
        >
          {cargando ? "Procesando..." : etiquetaConfirmar}
        </button>
      </div>
    </Modal>
  );
}
