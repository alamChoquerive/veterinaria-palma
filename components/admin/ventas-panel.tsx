"use client";

import { useState } from "react";
import { FilaBarra, PanelGrafico } from "@/components/admin/grafico-barras";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import {
  COLOR_ESTADO_PEDIDO as COLOR_ESTADO,
  COLOR_ESTADO_TURNO,
  ETIQUETA_ESTADO_PEDIDO as ETIQUETA_ESTADO,
  ETIQUETA_ESTADO_TURNO,
} from "@/lib/constants";
import type { Pedido, Pago, Turno, Perfil } from "@/types/database.types";

export interface PedidoFila extends Pedido {
  perfil: Pick<Perfil, "id" | "nombre" | "apellido" | "email" | "rol"> | null;
  pago: Pick<Pago, "proveedor" | "estado"> | null;
  cantidadItems: number;
}

export interface TurnoVentaFila extends Turno {
  perfil: Pick<Perfil, "id" | "nombre" | "apellido" | "email"> | null;
}

type Vista = "ambos" | "petshop" | "veterinaria";
type FiltroEstado = "todos" | "cobrado" | "pendiente";

// Estados que cuentan como venta cobrada (pagada y no cancelada)
const ESTADOS_COBRADO = ["pagado", "preparando", "enviado", "entregado", "retiro_pendiente"];
const ESTADOS_PENDIENTE = ["pendiente", "pago_pendiente"];

const DIAS_ORDEN = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function inicioDeSemana(d: Date): Date {
  const copia = new Date(d);
  const dia = (copia.getDay() + 6) % 7; // lunes = 0
  copia.setHours(0, 0, 0, 0);
  copia.setDate(copia.getDate() - dia);
  return copia;
}

function clienteDe(p: PedidoFila): string {
  if (!p.perfil) return "Sin cuenta";
  return (
    `${p.perfil.nombre ?? ""} ${p.perfil.apellido ?? ""}`.trim() || p.perfil.email
  );
}

function metodoPagoDe(p: PedidoFila): string {
  if (p.pago?.proveedor) return p.pago.proveedor;
  if (ESTADOS_PENDIENTE.includes(p.estado)) return "Pendiente";
  return "—";
}

/* ---------------- Vista petshop (pedidos) ---------------- */

function PetshopView({ pedidos }: { pedidos: PedidoFila[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");

  const hoy = new Date();
  const inicioSemana = inicioDeSemana(new Date());

  const cobradosSemana = pedidos.filter(
    (p) =>
      ESTADOS_COBRADO.includes(p.estado) &&
      new Date(p.created_at) >= inicioSemana,
  );
  const totalSemana = cobradosSemana.reduce((s, p) => s + Number(p.total), 0);
  const totalHoy = cobradosSemana
    .filter((p) => new Date(p.created_at).toDateString() === hoy.toDateString())
    .reduce((s, p) => s + Number(p.total), 0);
  const ticketPromedio = cobradosSemana.length > 0 ? totalSemana / cobradosSemana.length : 0;

  // Gráfico: recaudado por día de la semana actual
  const porDia = DIAS_ORDEN.map((_, i) => {
    const idx = (i + 1) % 7; // getDay(): lunes=1 ... domingo=0
    return cobradosSemana
      .filter((p) => new Date(p.created_at).getDay() === idx)
      .reduce((s, p) => s + Number(p.total), 0);
  });
  const maxDia = Math.max(...porDia, 1);

  const filtrados = pedidos.filter((p) => {
    if (filtroEstado === "cobrado" && !ESTADOS_COBRADO.includes(p.estado)) return false;
    if (filtroEstado === "pendiente" && !ESTADOS_PENDIENTE.includes(p.estado)) return false;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      const enId = p.id.toLowerCase().includes(q);
      const enCliente = clienteDe(p).toLowerCase().includes(q);
      if (!enId && !enCliente) return false;
    }
    return true;
  });
  const totalFiltrado = filtrados.reduce((s, p) => s + Number(p.total), 0);

  const estiloFiltro = (activo: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      activo
        ? "bg-[#1e293b] text-white"
        : "bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
    }`;

  return (
    <div className="space-y-6">
      <PanelGrafico titulo="Ventas por día (semana actual)">
        {DIAS_ORDEN.map((d, i) => (
          <FilaBarra
            key={d}
            etiqueta={DIAS_CORTOS[i]}
            valor={Math.round(porDia[i])}
            max={Math.round(maxDia)}
            color="#1e293b"
            sufijo=""
          />
        ))}
      </PanelGrafico>

      {/* Cuadros: semana / día / ticket promedio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">Total ventas de la semana</div>
          <div className="text-2xl font-bold text-[#1e293b]">{formatearMoneda(totalSemana)}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">Total ventas del día</div>
          <div className="text-2xl font-bold text-[#1e293b]">{formatearMoneda(totalHoy)}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">Ticket promedio</div>
          <div className="text-2xl font-bold text-[#1e293b]">{formatearMoneda(ticketPromedio)}</div>
        </div>
      </div>

      {/* Buscador + filtro */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <input
          type="search"
          placeholder="Buscar por ID de compra o cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm bg-white"
        />
        <div className="flex gap-2">
          {(["todos", "cobrado", "pendiente"] as FiltroEstado[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={estiloFiltro(filtroEstado === f)}
            >
              {f === "todos" ? "Todos" : f === "cobrado" ? "Cobrado" : "Pendiente"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">ID compra</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Cliente</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Fecha</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-center">Items</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Método de pago</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Estado</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b] text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => (
                <tr key={p.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3 text-sm font-mono">#{p.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-sm">{clienteDe(p)}</td>
                  <td className="px-4 py-3 text-sm">{formatearFecha(p.created_at)}</td>
                  <td className="px-4 py-3 text-sm text-center">{p.cantidadItems}</td>
                  <td className="px-4 py-3 text-sm">{metodoPagoDe(p)}</td>
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
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  No hay transacciones para los filtros elegidos
                </td>
              </tr>
            )}
          </tbody>
          {filtrados.length > 0 && (
            <tfoot>
              <tr className="border-t bg-[#f8fafc]">
                <td colSpan={6} className="px-4 py-3 text-sm font-bold text-[#1e293b] text-right">
                  Total de ventas
                </td>
                <td className="px-4 py-3 text-sm font-bold text-[#1e293b] text-right">
                  {formatearMoneda(totalFiltrado)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* ---------------- Vista veterinaria (turnos) ---------------- */

function VeterinariaView({ turnos }: { turnos: TurnoVentaFila[] }) {
  const hoy = new Date();
  const inicioSemana = inicioDeSemana(new Date());

  const deLaSemana = turnos.filter(
    (t) => t.estado !== "cancelado" && new Date(`${t.fecha}T00:00:00`) >= inicioSemana,
  );
  const deHoy = deLaSemana.filter(
    (t) => new Date(`${t.fecha}T00:00:00`).toDateString() === hoy.toDateString(),
  );
  const promedioDia = deLaSemana.length / 7;

  const porDia = DIAS_ORDEN.map((_, i) => {
    const idx = (i + 1) % 7;
    return deLaSemana.filter((t) => new Date(`${t.fecha}T00:00:00`).getDay() === idx).length;
  });
  const maxDia = Math.max(...porDia, 1);

  return (
    <div className="space-y-6">
      <PanelGrafico titulo="Turnos por día (semana actual)">
        {DIAS_ORDEN.map((d, i) => (
          <FilaBarra key={d} etiqueta={DIAS_CORTOS[i]} valor={porDia[i]} max={maxDia} color="#0e7490" />
        ))}
      </PanelGrafico>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">Turnos de la semana</div>
          <div className="text-2xl font-bold text-[#1e293b]">{deLaSemana.length}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">Turnos del día</div>
          <div className="text-2xl font-bold text-[#1e293b]">{deHoy.length}</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="text-xs font-medium text-[#64748b] uppercase mb-1">Promedio por día</div>
          <div className="text-2xl font-bold text-[#1e293b]">
            {promedioDia.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-x-auto">
        <table className="w-full min-w-[680px] text-left border-collapse">
          <thead>
            <tr className="border-b bg-[#f8fafc]">
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Fecha</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Hora</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Especialidad</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Mascota / Responsable</th>
              <th className="px-4 py-3 text-xs font-medium text-[#64748b]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {deLaSemana.length > 0 ? (
              deLaSemana.map((t) => (
                <tr key={t.id} className="border-b hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{formatearFecha(t.fecha)}</td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {t.hora_inicio.slice(0, 5)} - {t.hora_fin.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-sm">{t.especialidad ?? "Sin especialidad"}</td>
                  <td className="px-4 py-3 text-sm">
                    {(() => {
                      const mascota = t.mascota_nombre?.trim();
                      const responsable =
                        t.responsable_nombre?.trim() ||
                        (t.perfil
                          ? `${t.perfil.nombre ?? ""} ${t.perfil.apellido ?? ""}`.trim() ||
                            t.perfil.email
                          : "");
                      if (mascota && responsable) return `${mascota} — ${responsable}`;
                      return mascota || responsable || "—";
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${COLOR_ESTADO_TURNO[t.estado] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {ETIQUETA_ESTADO_TURNO[t.estado] ?? t.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  No hay turnos esta semana
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Panel principal ---------------- */

export function VentasPanel({
  pedidos,
  turnos,
}: {
  pedidos: PedidoFila[];
  turnos: TurnoVentaFila[];
}) {
  const [vista, setVista] = useState<Vista>("ambos");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1e293b] mb-2">Ventas</h2>
          <p className="text-[#64748b]">Registro de todas las transacciones.</p>
        </div>
        <div className="flex rounded-lg border border-[#e2e8f0] bg-white overflow-hidden">
          {(["ambos", "petshop", "veterinaria"] as Vista[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                vista === v
                  ? "bg-[#1e293b] text-white"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              {v === "ambos" ? "Ambos" : v === "petshop" ? "Petshop" : "Veterinaria"}
            </button>
          ))}
        </div>
      </div>

      {(vista === "ambos" || vista === "petshop") && (
        <>
          {vista === "ambos" && (
            <h3 className="text-lg font-bold text-[#1e293b]">Petshop</h3>
          )}
          <PetshopView pedidos={pedidos} />
        </>
      )}
      {(vista === "ambos" || vista === "veterinaria") && (
        <>
          {vista === "ambos" && (
            <h3 className="text-lg font-bold text-[#1e293b] pt-2">Clínica veterinaria</h3>
          )}
          <VeterinariaView turnos={turnos} />
        </>
      )}
    </div>
  );
}
