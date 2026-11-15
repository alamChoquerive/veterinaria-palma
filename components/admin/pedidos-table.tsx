"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoPedido } from "@/core/actions/pedidos.action";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import type { Pedido, Perfil } from "@/types/database.types";

export interface PedidoAdminFila extends Pedido {
  perfil: Pick<Perfil, "id" | "nombre" | "apellido" | "email" | "rol"> | null;
}

type Filtro = "todos" | "pendiente" | "en_camino" | "entregado";

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  pago_pendiente: "Pago pendiente",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "En camino",
  entregado: "Entregado",
  retiro_pendiente: "Retiro pendiente",
  cancelado: "Cancelado",
};

const COLOR_ESTADO: Record<string, string> = {
  pendiente: "bg-[#fef3c7] text-[#92400e]",
  pago_pendiente: "bg-[#fef3c7] text-[#92400e]",
  pagado: "bg-[#d1fae5] text-[#065f46]",
  preparando: "bg-[#dbeafe] text-[#1e40af]",
  enviado: "bg-[#dbeafe] text-[#1e40af]",
  entregado: "bg-[#d1fae5] text-[#065f46]",
  retiro_pendiente: "bg-[#d1fae5] text-[#065f46]",
  cancelado: "bg-[#fee2e2] text-[#991b1b]",
};

const ETIQUETA_ENVIO: Record<string, string> = {
  retiro_tienda: "Retiro en local",
  envio_local: "Envío local",
  envio_provincial: "Envío provincial",
};

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
  const [mensaje, setMensaje] = useState<string | null>(null);

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
      setMensaje("Estado actualizado");
      router.refresh();
    } else {
      setMensaje(resultado.error);
    }
  }

  const estiloFiltro = (activo: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      activo
        ? "bg-[#1e293b] text-white"
        : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
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

      {mensaje && (
        <div className="p-3 rounded-lg bg-[#f0fdf4] text-[#065f46] text-sm border border-[#bbf7d0]">
          {mensaje}
        </div>
      )}

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">ID pedido</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Fecha</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Cliente</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Tipo</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Envío</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Estado</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Total</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">
                {puedeCambiarEstado ? "Cambiar estado" : "—"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => {
                const cliente = p.perfil
                  ? `${p.perfil.nombre ?? ""} ${p.perfil.apellido ?? ""}`.trim() || p.perfil.email
                  : "Sin cuenta";
                const tipo = p.perfil?.rol === "mayorista" ? "Mayorista" : p.perfil?.rol === "admin" ? "Admin" : "Minorista";
                return (
                  <tr key={p.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">#{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm">{formatearFecha(p.created_at)}</td>
                    <td className="px-4 py-3 text-sm">{cliente}</td>
                    <td className="px-4 py-3 text-sm">{tipo}</td>
                    <td className="px-4 py-3 text-sm">{ETIQUETA_ENVIO[p.metodo_entrega] ?? p.metodo_entrega}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ESTADO[p.estado] ?? "bg-[#e2e8f0] text-[#64748b]"}`}
                      >
                        {ETIQUETA_ESTADO[p.estado] ?? p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatearMoneda(Number(p.total))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {puedeCambiarEstado ? (
                        <select
                          value={p.estado}
                          disabled={cargando}
                          onChange={(e) =>
                            cambiarEstado(p.id, e.target.value as (typeof TODOS_ESTADOS)[number])
                          }
                          className="border border-[#e2e8f0] rounded-lg px-2 py-1 text-xs bg-white disabled:opacity-50"
                          aria-label={`Cambiar estado del pedido ${p.id.slice(0, 8)}`}
                        >
                          {TODOS_ESTADOS.map((e) => (
                            <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-[#94a3b8]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  No hay pedidos para el filtro elegido
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
