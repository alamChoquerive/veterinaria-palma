"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoPedido } from "@/core/actions/pedidos.action";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import {
  ETIQUETA_ENVIO,
  ETIQUETA_ESTADO_PEDIDO as ETIQUETA_ESTADO,
} from "@/lib/constants";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { FormFeedback } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Pedido, Perfil } from "@/types/database.types";

export interface PedidoAdminFila extends Pedido {
  perfil: Pick<Perfil, "id" | "nombre" | "apellido" | "email" | "rol"> | null;
}

type Filtro = "todos" | "pendiente" | "en_camino" | "entregado";

const TODOS_ESTADOS = [
  "pendiente",
  "pago_pendiente",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "retiro_pendiente",
  "cancelado",
] as const;

export function PedidosTable({
  pedidos,
  puedeCambiarEstado = true,
}: {
  pedidos: PedidoAdminFila[];
  puedeCambiarEstado?: boolean;
}) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [cancelarPendiente, setCancelarPendiente] = useState<PedidoAdminFila | null>(null);

  const filtrados = pedidos.filter((p) => {
    if (filtro === "pendiente")
      return ["pendiente", "pago_pendiente", "retiro_pendiente"].includes(p.estado);
    if (filtro === "en_camino") return ["preparando", "enviado"].includes(p.estado);
    if (filtro === "entregado") return p.estado === "entregado";
    return true;
  });

  async function cambiarEstado(pedidoId: string, estado: (typeof TODOS_ESTADOS)[number]) {
    setCargando(true);
    setMensaje(null);
    const resultado = await actualizarEstadoPedido({ pedidoId, estado });
    setCargando(false);
    if (resultado.ok) {
      setMensaje({ tipo: "exito", texto: "Estado actualizado" });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: resultado.error });
    }
  }

  // Pasar a "cancelado" es destructivo: pide confirmación con texto a tipear.
  // El resto de las transiciones se aplican directo (son operativas de rutina).
  function alElegirEstado(p: PedidoAdminFila, estado: string) {
    if (estado === "cancelado") {
      setCancelarPendiente(p);
      return;
    }
    void cambiarEstado(p.id, estado as (typeof TODOS_ESTADOS)[number]);
  }

  const estiloFiltro = (activo: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      activo
        ? "bg-primary text-primary-foreground"
        : "bg-card border border-border text-muted-foreground hover:bg-muted/50"
    }`;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(["todos", "pendiente", "en_camino", "entregado"] as Filtro[]).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={estiloFiltro(filtro === f)}
          >
            {f === "todos" ? "Todos" : f === "pendiente" ? "Pendiente" : f === "en_camino" ? "En camino" : "Entregado"}
          </button>
        ))}
      </div>

      {mensaje && <FormFeedback tipo={mensaje.tipo}>{mensaje.texto}</FormFeedback>}

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[860px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">ID pedido</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Envío</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-right">Total</th>
              <th className="px-4 py-3 text-xs font-medium text-muted-foreground text-center">
                {puedeCambiarEstado ? "Cambiar estado" : "—"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => {
                const cliente = clienteDe(p);
                const tipo = p.perfil?.rol === "mayorista" ? "Mayorista" : p.perfil?.rol === "admin" ? "Admin" : "Minorista";
                return (
                  <tr key={p.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">#{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">{formatearFecha(p.created_at)}</td>
                    <td className="px-4 py-3 text-sm">{cliente}</td>
                    <td className="px-4 py-3 text-sm">{tipo}</td>
                    <td className="px-4 py-3 text-sm">{ETIQUETA_ENVIO[p.metodo_entrega] ?? p.metodo_entrega}</td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={p.estado} tipo="pedido" />
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatearMoneda(Number(p.total))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {puedeCambiarEstado ? (
                        <select
                          value={p.estado}
                          disabled={cargando}
                          onChange={(e) => alElegirEstado(p, e.target.value)}
                          className="border border-border rounded-lg px-2 py-2 text-xs bg-card disabled:opacity-50"
                          aria-label={`Cambiar estado del pedido ${p.id.slice(0, 8)}`}
                        >
                          {TODOS_ESTADOS.map((e) => (
                            <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay pedidos para el filtro elegido
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {cancelarPendiente && (
        <ConfirmDialog
          titulo="Cancelar pedido"
          descripcion={
            <>
              Pedido <span className="font-mono">#{cancelarPendiente.id.slice(0, 8)}</span> de{" "}
              <span className="font-medium">{clienteDe(cancelarPendiente)}</span> por{" "}
              <span className="font-medium">{formatearMoneda(Number(cancelarPendiente.total))}</span>.
              El stock de los productos no se devuelve automáticamente.{" "}
              <span className="font-semibold text-destructive">No se puede deshacer.</span>
            </>
          }
          textoConfirmacion="CANCELAR"
          etiquetaConfirmar="Cancelar pedido"
          cargando={cargando}
          onConfirmar={() => {
            const p = cancelarPendiente;
            setCancelarPendiente(null);
            void cambiarEstado(p.id, "cancelado");
          }}
          onCerrar={() => setCancelarPendiente(null)}
        />
      )}
    </div>
  );
}

// Nombre del cliente de la fila (para el diálogo de confirmación)
function clienteDe(p: PedidoAdminFila): string {
  return (
    (p.perfil ? `${p.perfil.nombre ?? ""} ${p.perfil.apellido ?? ""}`.trim() || p.perfil.email : "Sin cuenta")
  );
}
