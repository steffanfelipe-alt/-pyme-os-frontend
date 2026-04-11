"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, Users, CheckSquare, TrendingUp, RefreshCw,
  CalendarClock, FileText, BarChart3, Clock,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAlertas } from "@/hooks/useAlertas";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { RiskBoard } from "@/components/dashboard/RiskBoard";
import { PageHeader } from "@/components/shared/PageHeader";
import { alertasApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const { resumen } = useAlertas();
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const handleGenerarAlertas = async () => {
    setGenerating(true);
    await alertasApi.generar().catch(() => {});
    setGenerating(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-gray-700 font-medium">No se pudo cargar el dashboard</p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-blue-600 hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  const { bloque_riesgo, bloque_carga, bloque_salud } = data;
  const totalClientes = bloque_salud.tiempo_real_por_cliente.length;
  const clientesRiesgo = bloque_riesgo.vencimientos_sin_docs.length + bloque_riesgo.clientes_sin_actividad.length;

  // Métricas adicionales
  const rentabilidadData = bloque_salud.rentabilidad_por_cliente;
  const clientesRentables = rentabilidadData.filter((r) => r.semaforo === "rentable").length;
  const clientesDeficitarios = rentabilidadData.filter((r) => r.semaforo === "deficitario").length;
  const docData = bloque_salud.documentacion_por_cliente;
  const pctConDocs = docData.length > 0
    ? Math.round(docData.reduce((sum, d) => sum + d.pct, 0) / docData.length)
    : 0;
  const vencimientosProximos = bloque_riesgo.vencimientos_sin_docs.length;
  const tiempoPromedio = bloque_carga.tiempo_promedio_resolucion[0]?.promedio_horas ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Vista operativa del estudio"
        actions={
          <button
            onClick={handleGenerarAlertas}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", generating && "animate-spin")} />
            {generating ? "Actualizando..." : "Actualizar alertas"}
          </button>
        }
      />

      {/* Métricas fila 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Alertas críticas"
          value={resumen?.criticas ?? 0}
          subtitle={`${resumen?.advertencias ?? 0} advertencias`}
          icon={AlertTriangle}
          variant={(resumen?.criticas ?? 0) > 0 ? "danger" : (resumen?.advertencias ?? 0) > 0 ? "warning" : "success"}
        />
        <MetricCard
          title="Clientes activos"
          value={totalClientes}
          subtitle={`${clientesRiesgo} en riesgo`}
          icon={Users}
          variant={clientesRiesgo > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Tareas retrasadas"
          value={bloque_riesgo.tareas_retrasadas.length}
          subtitle="Requieren atención"
          icon={CheckSquare}
          variant={bloque_riesgo.tareas_retrasadas.length > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Completadas a tiempo"
          value={`${bloque_carga.completadas_a_tiempo.total_pct.toFixed(0)}%`}
          subtitle="Este mes"
          icon={TrendingUp}
          variant={
            bloque_carga.completadas_a_tiempo.total_pct >= 80 ? "success" :
            bloque_carga.completadas_a_tiempo.total_pct >= 60 ? "warning" : "danger"
          }
          trend={
            bloque_carga.completadas_a_tiempo.mes_anterior_pct !== null
              ? {
                  value: Math.round(
                    bloque_carga.completadas_a_tiempo.total_pct -
                    bloque_carga.completadas_a_tiempo.mes_anterior_pct
                  ),
                  label: "vs mes anterior",
                }
              : undefined
          }
        />
      </div>

      {/* Métricas fila 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Vencimientos sin docs"
          value={vencimientosProximos}
          subtitle="Próximos 30 días"
          icon={CalendarClock}
          variant={vencimientosProximos > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Clientes rentables"
          value={clientesRentables}
          subtitle={`${clientesDeficitarios} deficitarios`}
          icon={BarChart3}
          variant={clientesDeficitarios > 0 ? "warning" : "success"}
        />
        <MetricCard
          title="Documentación"
          value={`${pctConDocs}%`}
          subtitle="Clientes con docs al día"
          icon={FileText}
          variant={pctConDocs >= 80 ? "success" : pctConDocs >= 50 ? "warning" : "danger"}
        />
        <MetricCard
          title="Tiempo promedio"
          value={tiempoPromedio !== null ? `${tiempoPromedio.toFixed(1)}h` : "—"}
          subtitle="Por tarea completada"
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Sección central */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vencimientos críticos */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Vencimientos sin documentación</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {bloque_riesgo.vencimientos_sin_docs.length} pendientes
              </p>
            </div>
            <Link href="/vencimientos" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver todos →
            </Link>
          </div>
          <AlertPanel
            items={bloque_riesgo.vencimientos_sin_docs}
            onResolve={(id) => router.push(`/clientes/${id}`)}
          />
        </div>

        {/* Sin actividad */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Sin actividad reciente</h2>
            <span className="text-xs text-gray-400">{bloque_riesgo.clientes_sin_actividad.length}</span>
          </div>
          <RiskBoard clientes={bloque_riesgo.clientes_sin_actividad} />
        </div>
      </div>

      {/* Rentabilidad por cliente */}
      {rentabilidadData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Rentabilidad por cliente</h2>
            <Link href="/reportes" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver reporte completo →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {rentabilidadData.slice(0, 10).map((r) => (
              <Link
                key={r.cliente_id}
                href={`/clientes/${r.cliente_id}`}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-xs hover:opacity-80 transition-opacity",
                  r.semaforo === "rentable" ? "bg-green-50 border-green-100" :
                  r.semaforo === "deficitario" ? "bg-red-50 border-red-100" :
                  r.semaforo === "neutro" ? "bg-amber-50 border-amber-100" :
                  "bg-gray-50 border-gray-100"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  r.semaforo === "rentable" ? "bg-green-500" :
                  r.semaforo === "deficitario" ? "bg-red-500" :
                  r.semaforo === "neutro" ? "bg-amber-400" : "bg-gray-300"
                )} />
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{r.nombre}</p>
                  <p className="text-gray-400">{r.horas_mes.toFixed(1)}h/mes</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Carga del equipo */}
      {bloque_carga.carga_por_contador.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Carga del equipo</h2>
            {bloque_carga.indice_concentracion.alerta && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                Concentración detectada
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {bloque_carga.carga_por_contador.map((contador) => {
              const bars = {
                verde: { bar: "bg-green-500", bg: "bg-green-50 border-green-100" },
                amarillo: { bar: "bg-amber-400", bg: "bg-amber-50 border-amber-100" },
                rojo: { bar: "bg-red-500", bg: "bg-red-50 border-red-100" },
              };
              const c = bars[contador.color] ?? bars.verde;
              return (
                <div key={contador.empleado_id} className={cn("rounded-lg p-4 border", c.bg)}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                      {contador.nombre.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{contador.nombre}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{contador.rol}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Carga</span>
                      <span className="font-semibold text-gray-800">{contador.porcentaje_carga.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", c.bar)}
                        style={{ width: `${Math.min(contador.porcentaje_carga, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {contador.cantidad_tareas} tareas · {contador.horas_comprometidas.toFixed(0)}h
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tareas retrasadas */}
      {bloque_riesgo.tareas_retrasadas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Tareas retrasadas</h2>
            <Link href="/tareas" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bloque_riesgo.tareas_retrasadas.slice(0, 6).map((t) => (
              <Link
                key={t.tarea_id}
                href="/tareas"
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.cliente_nombre} · retrasada{" "}
                    <span className="font-medium text-red-600">{t.dias_retraso}d</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
