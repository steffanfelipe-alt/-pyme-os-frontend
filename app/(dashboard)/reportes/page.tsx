"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, Users, AlertTriangle, Clock,
  CheckCircle2, Zap, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { reportesApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatHoras, cn } from "@/lib/utils";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "carga", label: "Carga del equipo" },
  { id: "rentabilidad", label: "Rentabilidad" },
  { id: "madurez", label: "Madurez" },
];

const NIVEL_CARGA_COLOR: Record<string, string> = {
  baja: "bg-green-100 text-green-700",
  media: "bg-amber-100 text-amber-700",
  alta: "bg-red-100 text-red-700",
};

const PRIORIDAD_COLOR: Record<string, string> = {
  alta: "bg-red-100 text-red-700",
  media: "bg-amber-100 text-amber-700",
  baja: "bg-blue-50 text-blue-600",
};

const ETAPA_COLOR: Record<number, string> = {
  1: "bg-red-100 text-red-800",
  2: "bg-amber-100 text-amber-800",
  3: "bg-blue-100 text-blue-800",
  4: "bg-green-100 text-green-800",
};

function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  sub,
}: {
  label: string;
  value: string | number;
  icon: any;
  variant?: "default" | "warning" | "danger" | "success";
  sub?: string;
}) {
  const iconColor =
    variant === "warning" ? "text-amber-500" :
    variant === "danger" ? "text-red-500" :
    variant === "success" ? "text-green-500" : "text-blue-500";
  const iconBg =
    variant === "warning" ? "bg-amber-50" :
    variant === "danger" ? "bg-red-50" :
    variant === "success" ? "bg-green-50" : "bg-blue-50";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportesPage() {
  const [tab, setTab] = useState("resumen");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);

    const fetchers: Record<string, () => Promise<any>> = {
      resumen: () => reportesApi.resumen(),
      carga: () => reportesApi.carga(),
      rentabilidad: () => reportesApi.rentabilidad(),
      madurez: () => reportesApi.madurez(),
    };

    fetchers[tab]?.()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="space-y-5">
      <PageHeader title="Reportes" description="Métricas operativas y análisis del estudio" />

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === t.id ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
          </div>
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      )}

      {error && (() => {
        const esTarifa = error.toLowerCase().includes("tarifa") || error.toLowerCase().includes("configurar");
        const esPeriodo = error.toLowerCase().includes("period") || error.toLowerCase().includes("fecha");
        const esConexion = error.toLowerCase().includes("conectar") || error.toLowerCase().includes("servidor");
        const mensajePrincipal = esTarifa
          ? "Configurá la tarifa-hora para ver este reporte"
          : esPeriodo
          ? "Período inválido — verificá el rango de fechas"
          : esConexion
          ? "No se pudo conectar al servidor"
          : "Error al cargar el reporte";
        const mensajeSecundario = esTarifa
          ? "Ir a Configuración → Datos del estudio → Tarifa hora"
          : esPeriodo
          ? null
          : error;
        return (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">{mensajePrincipal}</p>
              {mensajeSecundario && (
                <p className="text-xs text-red-500 mt-0.5">{mensajeSecundario}</p>
              )}
            </div>
          </div>
        );
      })()}

      {!loading && !error && data && (
        <>
          {/* ── RESUMEN ── */}
          {tab === "resumen" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Empleados en riesgo"
                  value={data.carga?.empleados?.filter((e: any) => e.nivel_carga === "alta").length ?? 0}
                  icon={Users}
                  variant="warning"
                  sub="Con carga alta"
                />
                <StatCard
                  label="Vencimientos en riesgo"
                  value={data.vencimientos?.vencimientos_alerta ?? 0}
                  icon={AlertTriangle}
                  variant="danger"
                  sub="Próximos 7 días"
                />
                <StatCard
                  label="Vencen hoy"
                  value={data.vencimientos?.vencen_hoy ?? 0}
                  icon={Clock}
                  variant={data.vencimientos?.vencen_hoy > 0 ? "danger" : "default"}
                />
                <StatCard
                  label="Automatizaciones pendientes"
                  value={data.automatizaciones_pendientes_revision ?? 0}
                  icon={Zap}
                  sub="Pendientes de revisión"
                />
              </div>

              {/* Cobertura SOPs */}
              {data.cobertura_sops !== undefined && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Cobertura de SOPs</h3>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round((data.cobertura_sops ?? 0) * 100)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        (data.cobertura_sops ?? 0) >= 0.8 ? "bg-green-500" :
                        (data.cobertura_sops ?? 0) >= 0.5 ? "bg-amber-400" : "bg-red-400"
                      )}
                      style={{ width: `${Math.round((data.cobertura_sops ?? 0) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Procesos documentados con SOP</p>
                </div>
              )}

              {/* Resumen de procesos */}
              {data.procesos && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.procesos.activos !== undefined && (
                    <StatCard label="Procesos activos" value={data.procesos.activos} icon={BarChart3} />
                  )}
                  {data.procesos.completados_mes !== undefined && (
                    <StatCard label="Completados este mes" value={data.procesos.completados_mes} icon={CheckCircle2} variant="success" />
                  )}
                </div>
              )}

              {/* Rentabilidad peor margen */}
              {data.rentabilidad?.clientes && (() => {
                const clientesConMargen = data.rentabilidad.clientes.filter((c: any) => c.margen_pct !== null && !c.sin_honorario);
                const peor = clientesConMargen.sort((a: any, b: any) => a.margen_pct - b.margen_pct)[0];
                return peor ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Peor margen del período</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-amber-800">{peor.nombre}</p>
                      <span className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded",
                        peor.margen_pct < 0 ? "text-red-700 bg-red-100" : "text-amber-700 bg-amber-100"
                      )}>
                        {peor.margen_pct?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* ── CARGA ── */}
          {tab === "carga" && (
            <div className="space-y-4">
              {data.empleados && data.empleados.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    {["Nombre", "Pendientes", "En curso", "Completadas", "Hs reales", "Nivel carga"].map((h) => (
                      <span key={h} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.empleados.map((e: any) => (
                      <div key={e.empleado_id ?? e.nombre} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3.5 items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                            {(e.nombre ?? "?").charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{e.nombre}</span>
                        </div>
                        <span className="text-sm text-gray-700">{e.tareas_pendientes ?? 0}</span>
                        <span className="text-sm text-gray-700">{e.tareas_en_curso ?? 0}</span>
                        <span className="text-sm text-gray-700">{e.tareas_completadas_periodo ?? 0}</span>
                        <span className="text-sm text-gray-700">
                          {e.horas_reales_sesiones != null ? `${e.horas_reales_sesiones} hs` : "—"}
                        </span>
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit",
                          NIVEL_CARGA_COLOR[e.nivel_carga] ?? "bg-gray-100 text-gray-600"
                        )}>
                          {e.nivel_carga?.toUpperCase() ?? "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin datos de carga para este período</p>
                </div>
              )}

              {data.periodo && (
                <p className="text-xs text-gray-400 text-right">Período: {data.periodo}</p>
              )}
            </div>
          )}

          {/* ── RENTABILIDAD ── */}
          {tab === "rentabilidad" && (
            <div className="space-y-4">
              {data.sin_configurar ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Tarifa-hora no configurada</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
                      Configurá la tarifa-hora del estudio en Configuración para calcular
                      la rentabilidad por cliente.
                    </p>
                  </div>
                  <a
                    href="/configuracion"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                  >
                    Ir a Configuración →
                  </a>
                </div>
              ) : (
              <>
              {data.tarifa_hora && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Tarifa hora configurada:</span>
                  <span className="font-semibold text-gray-700">{formatCurrency(data.tarifa_hora)}</span>
                </div>
              )}

              {data.clientes && data.clientes.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    {["Cliente", "Honorario", "Hrs reales", "Costo est.", "Rentabilidad", "Margen"].map((h) => (
                      <span key={h} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {data.clientes.map((c: any) => {
                      const esRentable = !c.alerta && !c.sin_honorario && c.margen_pct >= 0;
                      const esDeficitario = c.alerta;
                      const sinDatos = c.sin_honorario;

                      return (
                        <div key={c.cliente_id} className={cn(
                          "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3.5 items-center",
                          esDeficitario && "bg-red-50/30",
                          sinDatos && "opacity-60"
                        )}>
                          <div>
                            <p className="text-sm font-medium text-gray-800 truncate">{c.nombre}</p>
                            {sinDatos && <p className="text-[10px] text-gray-400">Sin honorario</p>}
                          </div>
                          <span className="text-sm text-gray-700">
                            {c.honorario_mensual ? formatCurrency(c.honorario_mensual) : "—"}
                          </span>
                          <span className="text-sm text-gray-700">
                            {formatHoras(c.horas_reales ?? 0)}
                          </span>
                          <span className="text-sm text-gray-700">
                            {c.costo_estimado ? formatCurrency(c.costo_estimado) : "—"}
                          </span>
                          <span className={cn(
                            "text-xs font-medium",
                            esRentable ? "text-green-700" : esDeficitario ? "text-red-700" : "text-gray-500"
                          )}>
                            {c.rentabilidad ? formatCurrency(c.rentabilidad) : "—"}
                          </span>
                          <div className="flex items-center gap-1">
                            {c.margen_pct !== null && c.margen_pct !== undefined ? (
                              <>
                                {c.margen_pct > 0 ? (
                                  <ArrowUp className="h-3 w-3 text-green-600" />
                                ) : c.margen_pct < 0 ? (
                                  <ArrowDown className="h-3 w-3 text-red-600" />
                                ) : (
                                  <Minus className="h-3 w-3 text-gray-400" />
                                )}
                                <span className={cn(
                                  "text-xs font-bold",
                                  sinDatos ? "text-gray-400" :
                                  c.margen_pct >= 0 ? "text-green-700" : "text-red-700"
                                )}>
                                  {c.margen_pct.toFixed(1)}%
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin datos de rentabilidad para este período</p>
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* ── MADUREZ ── */}
          {tab === "madurez" && (
            <div className="space-y-4">
              {data.etapa && (
                <div className={cn(
                  "rounded-xl border p-6",
                  ETAPA_COLOR[data.etapa.numero] ? "border-current" : "border-gray-100 bg-white"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shrink-0",
                      ETAPA_COLOR[data.etapa.numero] ?? "bg-gray-100 text-gray-700"
                    )}>
                      {data.etapa.numero}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{data.etapa.nombre}</p>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{data.etapa.descripcion}</p>
                    </div>
                  </div>
                </div>
              )}

              {data.indicadores && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(data.indicadores).map(([key, val]: [string, any]) => (
                    <div key={key} className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-xl font-bold text-gray-800">
                        {typeof val === "number" ? val : (val?.valor ?? val ?? "—")}
                      </p>
                      {val?.label && <p className="text-xs text-gray-400 mt-0.5">{val.label}</p>}
                    </div>
                  ))}
                </div>
              )}

              {data.proximos_pasos && data.proximos_pasos.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Próximos pasos recomendados</h3>
                  <div className="space-y-3">
                    {data.proximos_pasos.map((paso: any, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                          PRIORIDAD_COLOR[paso.prioridad] ?? "bg-gray-100 text-gray-600"
                        )}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{paso.descripcion}</p>
                          {paso.horas_estimadas && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              ~{paso.horas_estimadas}h estimadas
                            </p>
                          )}
                        </div>
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                          PRIORIDAD_COLOR[paso.prioridad] ?? "bg-gray-100 text-gray-600"
                        )}>
                          {paso.prioridad?.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
