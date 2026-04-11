"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Circle, Clock,
  ChevronRight, AlertCircle, Loader2, Play, Square, X,
} from "lucide-react";
import { procesosApi } from "@/lib/api";
import type { InstanciaProceso, InstanciaPaso, PasoProceso } from "@/types/proceso";
import { formatFecha, cn } from "@/lib/utils";
import Link from "next/link";

function formatMinutos(min: number | null | undefined): string {
  if (!min) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function InstanciaProcesoPage() {
  const { instanciaId } = useParams<{ instanciaId: string }>();
  const router = useRouter();
  const [instancia, setInstancia] = useState<InstanciaProceso | null>(null);
  const [templatePasos, setTemplatePasos] = useState<PasoProceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [avanzando, setAvanzando] = useState<number | null>(null);
  const [accionando, setAccionando] = useState<"iniciar" | "completar" | "cancelar" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const data = await procesosApi.obtenerInstancia(Number(instanciaId));
      setInstancia(data);
      try {
        const template = await procesosApi.obtener(data.template_id);
        setTemplatePasos(template.pasos ?? []);
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar instancia");
    } finally {
      setLoading(false);
    }
  }, [instanciaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAvanzar = async (paso: InstanciaPaso) => {
    if (!instancia) return;
    setAvanzando(paso.id);
    setError(null);
    try {
      await procesosApi.avanzarPaso(instancia.id, paso.id);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al avanzar paso");
    } finally {
      setAvanzando(null);
    }
  };

  const handleAccionInstancia = async (accion: "iniciar" | "completar" | "cancelar") => {
    if (!instancia) return;
    if (accion === "cancelar" && !confirm("¿Cancelar este proceso?")) return;
    setAccionando(accion);
    setError(null);
    try {
      if (accion === "iniciar") await procesosApi.iniciarInstancia(instancia.id);
      else if (accion === "completar") await procesosApi.completarInstancia(instancia.id);
      else await procesosApi.cancelarInstancia(instancia.id);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Error al ${accion}`);
    } finally {
      setAccionando(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
        <div className="h-3 bg-gray-100 rounded-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!instancia || (error && !instancia)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-gray-700 font-medium">No se pudo cargar el proceso</p>
        {error && <p className="text-sm text-gray-400 mt-1">{error}</p>}
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">
          Volver
        </button>
      </div>
    );
  }

  const pasos: InstanciaPaso[] = instancia.pasos ?? [];
  const completados = pasos.filter((p) => p.estado === "completado").length;
  const total = pasos.length;
  const pct = total > 0 ? Math.round((completados / total) * 100) : (instancia.progreso_pct ?? 0);
  const tiempoReal = (instancia as any).tiempo_real_minutos as number | null | undefined;

  const templatePorOrden = Object.fromEntries(templatePasos.map((p) => [p.orden, p]));

  const isPendiente = instancia.estado === "pendiente";
  const isEnProgreso = instancia.estado === "en_progreso";
  const isTerminado = instancia.estado === "completado" || instancia.estado === "cancelado";

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-1 p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">
            {templatePasos.length > 0
              ? templatePasos[0]?.titulo
                ? `Proceso: ${instancia.template_id}`
                : `Proceso #${instancia.template_id}`
              : `Proceso #${instancia.template_id}`}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 flex-wrap">
            {instancia.cliente_id && (
              <>
                <Link href={`/clientes/${instancia.cliente_id}`} className="hover:text-blue-600 transition-colors">
                  {(instancia as any).cliente_nombre ?? `Cliente #${instancia.cliente_id}`}
                </Link>
                <span className="text-gray-200">·</span>
              </>
            )}
            {instancia.fecha_inicio && <span>Iniciado {formatFecha(instancia.fecha_inicio)}</span>}
            <span className={cn(
              "font-medium text-xs px-2 py-0.5 rounded-full",
              isEnProgreso ? "bg-blue-100 text-blue-700" :
              instancia.estado === "completado" ? "bg-green-100 text-green-700" :
              instancia.estado === "cancelado" ? "bg-red-100 text-red-600" :
              "bg-gray-100 text-gray-600"
            )}>
              {isEnProgreso ? "En progreso" :
               instancia.estado === "completado" ? "Completado" :
               instancia.estado === "cancelado" ? "Cancelado" : "Pendiente"}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de estado */}
      {!isTerminado && (
        <div className="flex gap-2">
          {isPendiente && (
            <button
              onClick={() => handleAccionInstancia("iniciar")}
              disabled={!!accionando}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {accionando === "iniciar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Iniciar proceso
            </button>
          )}
          {isEnProgreso && (
            <button
              onClick={() => handleAccionInstancia("completar")}
              disabled={!!accionando}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {accionando === "completar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Marcar completado
            </button>
          )}
          <button
            onClick={() => handleAccionInstancia("cancelar")}
            disabled={!!accionando}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {accionando === "cancelar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Cancelar
          </button>
        </div>
      )}

      {/* Barra de progreso + tiempo */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">Progreso general</p>
          <p className="text-sm font-bold text-gray-900">{pct}%</p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-400"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{completados} de {total} pasos completados</span>
          {tiempoReal != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Tiempo real: <strong className="text-gray-600 ml-1">{formatMinutos(tiempoReal)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Error inline */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* SOP vinculado */}
      {instancia.sop_vinculado && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
          <p className="text-xs font-semibold text-blue-700 mb-1">
            SOP: {instancia.sop_vinculado.titulo}
          </p>
          <p className="text-xs text-blue-600">{instancia.sop_vinculado.descripcion_proposito}</p>
        </div>
      )}

      {/* Pasos */}
      {pasos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Sin pasos cargados</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pasos del proceso
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {pasos.map((paso, idx) => {
              const completado = paso.estado === "completado";
              const pendiente = paso.estado === "pendiente";
              const anterior = idx > 0 ? pasos[idx - 1] : null;
              const bloqueado = !completado && anterior !== null && anterior.estado !== "completado";
              const isAvanzando = avanzando === paso.id;
              const tPaso = templatePorOrden[paso.orden];
              const titulo = tPaso?.titulo ?? `Paso ${paso.orden}`;
              const descripcion = paso.guia_sop ?? tPaso?.descripcion ?? null;
              const tiempoPaso = (paso as any).tiempo_real_minutos as number | null | undefined;

              return (
                <div
                  key={paso.id}
                  className={cn(
                    "flex items-start gap-4 px-4 py-4 transition-colors",
                    completado && "bg-green-50/30",
                    bloqueado && "opacity-50"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {completado ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className={cn("h-5 w-5", bloqueado ? "text-gray-200" : "text-gray-300")} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={cn(
                          "text-sm font-medium",
                          completado ? "text-gray-500 line-through" : "text-gray-800"
                        )}>
                          <span className="text-gray-400 mr-1.5">{paso.orden}.</span>
                          {titulo}
                        </p>
                        {descripcion && (
                          <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>
                        )}
                        <div className="flex items-center gap-3 mt-0.5">
                          {completado && paso.fecha_fin && (
                            <p className="text-[10px] text-green-600">
                              Completado {formatFecha(paso.fecha_fin)}
                            </p>
                          )}
                          {completado && tiempoPaso != null && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {formatMinutos(tiempoPaso)}
                            </p>
                          )}
                        </div>
                        {paso.notas && (
                          <p className="text-xs text-gray-500 mt-1 italic">{paso.notas}</p>
                        )}
                      </div>

                      {pendiente && !bloqueado && isEnProgreso && (
                        <button
                          onClick={() => handleAvanzar(paso)}
                          disabled={isAvanzando}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        >
                          {isAvanzando ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          {isAvanzando ? "Guardando..." : "Completar paso"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {instancia.estado === "completado" && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">Proceso completado</p>
            <div className="flex items-center gap-4 mt-0.5">
              {instancia.fecha_fin && (
                <p className="text-xs text-green-600">Finalizado el {formatFecha(instancia.fecha_fin)}</p>
              )}
              {tiempoReal != null && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Tiempo total: {formatMinutos(tiempoReal)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {instancia.estado === "cancelado" && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <X className="h-6 w-6 text-red-400 shrink-0" />
          <p className="text-sm font-semibold text-red-700">Proceso cancelado</p>
        </div>
      )}
    </div>
  );
}
