"use client";

import { useState } from "react";
import { ESPECIALIDADES } from "@/lib/data/especialidades";
import { FilaBarra, PanelGrafico } from "@/components/admin/grafico-barras";
import type { TurnoFila } from "@/components/admin/turnos-panel";

type Periodo = "semana" | "mes" | "año" | "todo";

const DIAS_ORDEN = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function inicioDeSemana(d: Date): Date {
  const copia = new Date(d);
  const dia = (copia.getDay() + 6) % 7; // lunes = 0
  copia.setHours(0, 0, 0, 0);
  copia.setDate(copia.getDate() - dia);
  return copia;
}

function diasDelPeriodo(periodo: Periodo, turnos: TurnoFila[]): number {
  const hoy = new Date();
  if (periodo === "semana") return 7;
  if (periodo === "mes") return new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  if (periodo === "año") {
    return hoy.getFullYear() % 4 === 0 && (hoy.getFullYear() % 100 !== 0 || hoy.getFullYear() % 400 === 0) ? 366 : 365;
  }
  // todo: días desde el turno más viejo hasta hoy (mínimo 1)
  if (turnos.length === 0) return 1;
  const fechas = turnos.map((t) => new Date(`${t.fecha}T00:00:00`).getTime());
  const minimo = Math.min(...fechas);
  const diffDias = Math.floor((hoy.setHours(0, 0, 0, 0) - minimo) / 86400000) + 1;
  return Math.max(diffDias, 1);
}

function especialidadDe(t: TurnoFila): string {
  return t.especialidad?.trim() || "Sin especialidad";
}

function profesionalDe(t: TurnoFila): string {
  const esp = ESPECIALIDADES.find((e) => e.nombre === t.especialidad);
  return esp?.profesional ?? "Sin asignar";
}

export function EstadisticasView({ turnos }: { turnos: TurnoFila[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("mes");

  const hoy = new Date();
  let inicio: Date | null = null;
  if (periodo === "semana") inicio = inicioDeSemana(new Date());
  if (periodo === "mes") inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  if (periodo === "año") inicio = new Date(hoy.getFullYear(), 0, 1);

  const delPeriodo = turnos.filter((t) => {
    if (!inicio) return true;
    return new Date(`${t.fecha}T00:00:00`) >= inicio;
  });

  // KPIs
  const atendidos = delPeriodo.filter((t) => t.estado === "atendido").length;
  const cancelados = delPeriodo.filter((t) => t.estado === "cancelado").length;

  const conteoEspecialidades = new Map<string, number>();
  for (const t of delPeriodo) {
    const nombre = especialidadDe(t);
    conteoEspecialidades.set(nombre, (conteoEspecialidades.get(nombre) ?? 0) + 1);
  }
  const especialidadTop =
    [...conteoEspecialidades.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const diasPeriodo = diasDelPeriodo(periodo, delPeriodo);
  const promedioPorDia = delPeriodo.length / diasPeriodo;

  // Gráfico 1: turnos por día de la semana
  const porDiaSemana = DIAS_ORDEN.map((_, i) => {
    const idx = (i + 1) % 7; // getDay(): lunes=1 ... domingo=0
    return delPeriodo.filter((t) => new Date(`${t.fecha}T00:00:00`).getDay() === idx).length;
  });
  const maxDia = Math.max(...porDiaSemana, 1);

  // Gráfico 2: atendidos vs cancelados por día de la semana
  const atendidosPorDia = DIAS_ORDEN.map((_, i) => {
    const idx = (i + 1) % 7;
    return delPeriodo.filter(
      (t) => new Date(`${t.fecha}T00:00:00`).getDay() === idx && t.estado === "atendido",
    ).length;
  });
  const canceladosPorDia = DIAS_ORDEN.map((_, i) => {
    const idx = (i + 1) % 7;
    return delPeriodo.filter(
      (t) => new Date(`${t.fecha}T00:00:00`).getDay() === idx && t.estado === "cancelado",
    ).length;
  });
  const maxEstadoDia = Math.max(...atendidosPorDia, ...canceladosPorDia, 1);

  // Gráfico 3: ranking de especialidades
  const rankingEspecialidades = [...conteoEspecialidades.entries()].sort((a, b) => b[1] - a[1]);
  const maxEsp = Math.max(...rankingEspecialidades.map(([, v]) => v), 1);

  // Gráfico 4: pacientes atendidos por profesional
  const porProfesional = new Map<string, number>();
  for (const t of delPeriodo) {
    if (t.estado !== "atendido") continue;
    const prof = profesionalDe(t);
    porProfesional.set(prof, (porProfesional.get(prof) ?? 0) + 1);
  }
  const rankingProfesionales = [...porProfesional.entries()].sort((a, b) => b[1] - a[1]);
  const maxProf = Math.max(...rankingProfesionales.map(([, v]) => v), 1);

  const estiloPeriodo = (activo: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      activo
        ? "bg-primary text-primary-foreground"
        : "bg-card border border-border text-muted-foreground hover:bg-muted/50"
    }`;

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase mr-1">Período:</span>
        {(["semana", "mes", "año", "todo"] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={estiloPeriodo(periodo === p)}
          >
            {p === "semana" ? "Semana" : p === "mes" ? "Mes" : p === "año" ? "Año" : "Todo"}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Pacientes atendidos</div>
          <div className="text-2xl font-bold text-[#065f46]">{atendidos}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Turnos cancelados</div>
          <div className="text-2xl font-bold text-destructive">{cancelados}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Especialidad más solicitada</div>
          <div className="text-lg font-bold text-primary leading-8">{especialidadTop}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Promedio de turnos por día</div>
          <div className="text-2xl font-bold text-primary">
            {promedioPorDia.toLocaleString("es-AR", { maximumFractionDigits: 1 })}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PanelGrafico titulo="Turnos por día de la semana">
          {DIAS_ORDEN.map((d, i) => (
            <FilaBarra
              key={d}
              etiqueta={DIAS_CORTOS[i]}
              valor={porDiaSemana[i]}
              max={maxDia}
              color="var(--color-primary)"
            />
          ))}
        </PanelGrafico>

        <PanelGrafico titulo="Atendidos vs cancelados por día">
          <div className="flex gap-4 text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#059669" }} />
              Atendidos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "#dc2626" }} />
              Cancelados
            </span>
          </div>
          {DIAS_ORDEN.map((d, i) => (
            <div key={d} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs text-muted-foreground">{DIAS_CORTOS[i]}</span>
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{
                      width: `${maxEstadoDia > 0 ? Math.max((atendidosPorDia[i] / maxEstadoDia) * 100, atendidosPorDia[i] > 0 ? 5 : 0) : 0}%`,
                      backgroundColor: "#059669",
                    }}
                  />
                </div>
                <div className="h-2.5 bg-muted rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{
                      width: `${maxEstadoDia > 0 ? Math.max((canceladosPorDia[i] / maxEstadoDia) * 100, canceladosPorDia[i] > 0 ? 5 : 0) : 0}%`,
                      backgroundColor: "#dc2626",
                    }}
                  />
                </div>
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-bold text-primary">
                {atendidosPorDia[i]}/{canceladosPorDia[i]}
              </span>
            </div>
          ))}
        </PanelGrafico>

        <PanelGrafico titulo="Ranking de especialidades más solicitadas">
          {rankingEspecialidades.length > 0 ? (
            rankingEspecialidades.map(([nombre, valor]) => (
              <FilaBarra
                key={nombre}
                etiqueta={nombre}
                valor={valor}
                max={maxEsp}
                color="#0e7490"
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin turnos en el período</p>
          )}
        </PanelGrafico>

        <PanelGrafico titulo="Pacientes atendidos por profesional">
          {rankingProfesionales.length > 0 ? (
            rankingProfesionales.map(([nombre, valor]) => (
              <FilaBarra
                key={nombre}
                etiqueta={nombre}
                valor={valor}
                max={maxProf}
                color="#065f46"
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin pacientes atendidos en el período
            </p>
          )}
        </PanelGrafico>
      </div>
    </div>
  );
}
