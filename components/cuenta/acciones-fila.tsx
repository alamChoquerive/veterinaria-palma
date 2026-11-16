"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelarTurno } from "@/core/actions/turnos.action";
import { cancelarPedidoPropio } from "@/core/actions/pedido.action";

const foco =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Botón de cancelar con confirmación inline en dos pasos (no window.confirm). */
function BotonCancelar({
  alConfirmar,
  etiqueta,
}: {
  alConfirmar: () => Promise<void>;
  etiqueta: string;
}) {
  const [pidiendo, setPidiendo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pidiendo) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">¿Seguro?</span>
        <button
          type="button"
          disabled={cargando}
          onClick={async () => {
            setCargando(true);
            setError(null);
            try {
              await alConfirmar();
              setPidiendo(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "No se pudo cancelar");
            }
            setCargando(false);
          }}
          className={`text-xs font-medium px-2 py-1 rounded-md bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca] disabled:opacity-50 ${foco}`}
        >
          {cargando ? "Cancelando…" : "Sí, cancelar"}
        </button>
        <button
          type="button"
          disabled={cargando}
          onClick={() => setPidiendo(false)}
          className={`text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50 ${foco}`}
        >
          No
        </button>
        {error && (
          <span role="alert" className="text-xs text-[#991b1b]">
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPidiendo(true)}
      className={`text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground ${foco}`}
    >
      {etiqueta}
    </button>
  );
}

/** Acciones de una fila de "Mis turnos": cancelar si está pendiente/confirmado. */
export function AccionesTurno({ turnoId, estado }: { turnoId: string; estado: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (estado !== "pendiente" && estado !== "confirmado") return null;

  return (
    <BotonCancelar
      etiqueta="Cancelar turno"
      alConfirmar={async () => {
        const res = await cancelarTurno(turnoId);
        if (!res.ok) throw new Error(res.error);
        startTransition(() => router.refresh());
      }}
    />
  );
}

/** Acciones de una fila de "Mis pedidos": pagar si quedó pago_pendiente, cancelar si pendiente. */
export function AccionesPedido({
  pedidoId,
  estado,
}: {
  pedidoId: string;
  estado: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  if (estado === "pago_pendiente") {
    // /checkout reanuda el último pedido pago_pendiente en vez de duplicarlo
    return (
      <span className="flex items-center gap-2">
        <Link
          href="/checkout"
          className={`text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 ${foco}`}
        >
          Pagar ahora
        </Link>
        <BotonCancelar
          etiqueta="Cancelar"
          alConfirmar={async () => {
            const res = await cancelarPedidoPropio({ pedidoId });
            if (!res.ok) throw new Error(res.error);
            startTransition(() => router.refresh());
          }}
        />
      </span>
    );
  }

  if (estado === "pendiente") {
    return (
      <BotonCancelar
        etiqueta="Cancelar pedido"
        alConfirmar={async () => {
          const res = await cancelarPedidoPropio({ pedidoId });
          if (!res.ok) throw new Error(res.error);
          startTransition(() => router.refresh());
        }}
      />
    );
  }

  return null;
}
