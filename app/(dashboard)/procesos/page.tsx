"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GitBranch, ChevronRight, X, Sparkles, Zap, FileText,
  Bot, Plus, Loader2, AlertCircle, CheckCircle2,
} from "lucide-react";
import { procesosApi, clientesApi, automatizacionesApi, automatizacionesPythonApi } from "@/lib/api";
import type { Proceso, InstanciaProceso } from "@/types/proceso";
import type { AutomatizacionPython } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingCard } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatFecha, cn } from "@/lib/utils";

// ─── Tipos modales IA ─────────────────────────────────────────────────────────

type AccionIA =
  | "analizar_automatizabilidad"
  | "generar_n8n"
  | "generar_sop"
  | "documentar_ia"
  | "optimizar_ia";

interface ModalIA {
  tipo: AccionIA;
  template: Proceso;
  resultado: any;
  loading: boolean;
  error: string | null;
}

interface ModalNuevoTemplate {
  modo: "ia" | "manual";
  descripcion: string;
  nombre: string;
  loading: boolean;
  resultado: any | null;
  guardando: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ResultadoAnalisis({ data }: { data: any }) {
  if (!data) return null;
  const pasos: any[] = data.pasos ?? [];
  const resumen = data.resumen ?? data.resumen_ejecutivo ?? "";
  const ahorro = data.ahorro_total_horas_mes ?? data.ahorro_estimado_horas_mes;

  return (
    <div className="space-y-3 text-sm">
      {resumen && <p className="text-gray-600">{resumen}</p>}
      {ahorro !== undefined && (
        <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-green-800 font-medium">
            Ahorro estimado: {Number(ahorro).toFixed(1)} hs/mes
          </span>
        </div>
      )}
      {pasos.length > 0 && (
        <div className="space-y-2">
          {pasos.map((p: any, i: number) => (
            <div key={i} className={cn(
              "flex items-start gap-2 px-3 py-2 rounded-lg border",
              p.automatizable || p.es_automatizable
                ? "border-green-200 bg-green-50"
                : "border-gray-100 bg-gray-50"
            )}>
              <span className="text-xs font-bold text-gray-500 mt-0.5 shrink-0 w-5">{p.orden ?? i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800">{p.titulo ?? p.nombre}</p>
                {(p.herramienta_sugerida || p.razon) && (
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {p.herramienta_sugerida ? `Herramienta: ${p.herramienta_sugerida}` : ""}
                    {p.razon ? ` — ${p.razon}` : ""}
                  </p>
                )}
              </div>
              {(p.automatizable || p.es_automatizable) && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold shrink-0">
                  AUTO
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultadoN8n({ data }: { data: any }) {
  const flujo = data?.automatizacion?.flujo_json ?? data?.flujo_json ?? data;
  const json = JSON.stringify(flujo, null, 2);
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Copiá este JSON e importalo en n8n desde <strong>File → Import from JSON</strong>.
      </p>
      <div className="relative">
        <pre className="bg-gray-900 text-green-400 text-[11px] p-3 rounded-xl overflow-auto max-h-72 font-mono">
          {json}
        </pre>
        <button
          onClick={() => navigator.clipboard?.writeText(json)}
          className="absolute top-2 right-2 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition-colors"
        >
          Copiar
        </button>
      </div>
    </div>
  );
}

function ResultadoSop({ data }: { data: any }) {
  const sopUrl = data?.sop_url
    ? data.sop_url.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${data.sop_url}`
      : data.sop_url
    : null;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="text-blue-800 font-medium">SOP generado exitosamente</span>
      </div>
      {sopUrl && (
        <a
          href={sopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-blue-600 hover:text-blue-700 text-sm underline"
        >
          Descargar PDF del SOP →
        </a>
      )}
      {data?.mensaje && <p className="text-gray-600 text-xs">{data.mensaje}</p>}
    </div>
  );
}

function ResultadoDocumentarIA({ data }: { data: any }) {
  if (!data) return null;
  const pasos: any[] = data.pasos ?? [];
  return (
    <div className="space-y-3 text-sm">
      {data.nombre && <p className="font-semibold text-gray-900">{data.nombre}</p>}
      {data.descripcion && <p className="text-gray-600 text-xs">{data.descripcion}</p>}
      {pasos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-700">Pasos sugeridos:</p>
          {pasos.map((p: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {p.orden ?? i + 1}
              </span>
              <div>
                <p className="font-medium text-gray-800">{p.titulo ?? p.nombre}</p>
                {p.descripcion && <p className="text-gray-500">{p.descripcion}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultadoOptimizarIA({
  data,
  onAplicar,
  onRestaurar,
  aplicando,
  tieneVersionAnterior,
}: {
  data: { original: any; optimizado: any } | null;
  onAplicar: (optimizado: any) => void;
  onRestaurar: () => void;
  aplicando: boolean;
  tieneVersionAnterior: boolean;
}) {
  const [tab, setTab] = useState<"original" | "optimizado">("optimizado");
  if (!data) return null;
  const src = tab === "original" ? data.original : data.optimizado;
  const pasos: any[] = src?.pasos ?? [];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("original")}
          className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
            tab === "original" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
        >
          Original
        </button>
        <button
          onClick={() => setTab("optimizado")}
          className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
            tab === "optimizado" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}
        >
          ✨ Versión IA
        </button>
      </div>

      {src?.descripcion && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">{src.descripcion}</p>
      )}

      <div className="space-y-2">
        {pasos.map((p: any, i: number) => (
          <div key={i} className={cn(
            "flex items-start gap-2 px-3 py-2 rounded-lg border text-sm",
            p.es_automatizable ? "border-green-200 bg-green-50" : "border-gray-100 bg-white"
          )}>
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              {p.orden ?? i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{p.titulo}</p>
              {p.descripcion && <p className="text-[11px] text-gray-500 mt-0.5">{p.descripcion}</p>}
              {p.tiempo_estimado_minutos && (
                <p className="text-[10px] text-gray-400 mt-0.5">{p.tiempo_estimado_minutos} min</p>
              )}
            </div>
            {p.es_automatizable && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold shrink-0">AUTO</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        {tab === "optimizado" && (
          <button
            onClick={() => onAplicar(data.optimizado)}
            disabled={aplicando}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {aplicando ? "Aplicando..." : "Aplicar versión IA"}
          </button>
        )}
        {tieneVersionAnterior && (
          <button
            onClick={onRestaurar}
            disabled={aplicando}
            className="flex-1 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            Restaurar anterior
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ProcesosPage() {
  const toast = useToast();
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [instancias, setInstancias] = useState<InstanciaProceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [tab, setTab] = useState<"activas" | "templates" | "automatizaciones">("activas");
  const [autoPythonActivas, setAutoPythonActivas] = useState<AutomatizacionPython[]>([]);

  // Modal "Usar template"
  const [modalProceso, setModalProceso] = useState<Proceso | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [iniciando, setIniciando] = useState(false);

  // Modal IA (analizar, n8n, sop, documentar, optimizar)
  const [modalIA, setModalIA] = useState<ModalIA | null>(null);
  const [aplicandoOpt, setAplicandoOpt] = useState(false);

  // Modal "Nuevo template"
  const [modalNuevo, setModalNuevo] = useState<ModalNuevoTemplate | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [p, i, autos] = await Promise.all([
        procesosApi.listar(),
        procesosApi.instancias({ estado: "en_progreso" }),
        automatizacionesPythonApi.listar().catch(() => [] as AutomatizacionPython[]),
      ]);
      setProcesos(p);
      setInstancias(i);
      setAutoPythonActivas(autos.filter((a: AutomatizacionPython) => a.estado === "activo"));
    } catch (err: any) {
      setErrorCarga(err.message ?? "Error al cargar los procesos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Modal usar template ──

  const abrirModal = async (proceso: Proceso) => {
    setModalProceso(proceso);
    setClienteId("");
    try {
      const c = await clientesApi.listar({ limit: 500 });
      setClientes(c.map((x: any) => ({ id: x.id, nombre: x.nombre })));
    } catch {}
  };

  const handleIniciar = async () => {
    if (!modalProceso || !clienteId) return;
    setIniciando(true);
    try {
      await procesosApi.crearInstancia(modalProceso.id, Number(clienteId));
      setModalProceso(null);
      setTab("activas");
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al iniciar el proceso");
    } finally {
      setIniciando(false);
    }
  };

  // ── Acciones IA ──

  const ejecutarAccionIA = async (tipo: AccionIA, template: Proceso) => {
    setModalIA({ tipo, template, resultado: null, loading: true, error: null });
    try {
      let resultado: any;
      if (tipo === "analizar_automatizabilidad") {
        resultado = await procesosApi.analizarAutomatizabilidad(template.id);
      } else if (tipo === "generar_n8n") {
        resultado = await automatizacionesApi.generar(template.id);
      } else if (tipo === "generar_sop") {
        resultado = await procesosApi.generarSop(template.id);
      } else if (tipo === "documentar_ia") {
        resultado = await procesosApi.optimizarDesdeDescripcion(
          template.descripcion ?? template.nombre
        );
      } else if (tipo === "optimizar_ia") {
        resultado = await procesosApi.previsualizarOptimizacion(template.id);
      }
      setModalIA((prev) => prev ? { ...prev, resultado, loading: false } : null);
    } catch (e: any) {
      setModalIA((prev) => prev ? { ...prev, loading: false, error: e.message ?? "Error" } : null);
    }
  };

  const handleAplicarOptimizacion = async (optimizado: any) => {
    if (!modalIA) return;
    setAplicandoOpt(true);
    try {
      await procesosApi.aplicarOptimizacion(
        modalIA.template.id,
        optimizado.descripcion ?? null,
        optimizado.pasos ?? []
      );
      toast.success("Optimización aplicada correctamente");
      setModalIA(null);
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al aplicar la optimización");
    } finally {
      setAplicandoOpt(false);
    }
  };

  const handleRestaurarVersionAnterior = async (templateId: number) => {
    try {
      await procesosApi.restaurarVersionAnterior(templateId);
      toast.success("Versión anterior restaurada");
      setModalIA(null);
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al restaurar la versión anterior");
    }
  };

  // ── Guardar template generado por IA ──

  // Tipos válidos del backend TipoProceso enum
  const TIPOS_VALIDOS = new Set([
    "onboarding", "liquidacion_iva", "balance", "cierre_ejercicio",
    "declaracion_ganancias", "declaracion_iibb", "otro",
  ]);

  const handleGuardarTemplateIA = async () => {
    if (!modalNuevo?.resultado) return;
    setModalNuevo((prev) => prev ? { ...prev, guardando: true } : null);
    try {
      const r = modalNuevo.resultado;
      const tipoRaw = (r.tipo ?? "otro").toLowerCase().replace(/\s+/g, "_");
      const tipo = TIPOS_VALIDOS.has(tipoRaw) ? tipoRaw : "otro";

      // Paso 1: crear template
      const template = await procesosApi.crearTemplate({
        nombre: r.nombre ?? modalNuevo.nombre ?? "Proceso generado por IA",
        descripcion: r.descripcion ?? modalNuevo.descripcion,
        tipo,
      });

      // Paso 2: agregar pasos uno a uno
      const pasos: any[] = r.pasos ?? [];
      for (let i = 0; i < pasos.length; i++) {
        const p = pasos[i];
        await procesosApi.agregarPaso(template.id, {
          titulo: p.titulo ?? p.nombre ?? `Paso ${i + 1}`,
          descripcion: p.descripcion ?? "",
          orden: p.orden ?? i + 1,
          tiempo_estimado_minutos: p.tiempo_estimado_minutos ?? null,
          es_automatizable: p.es_automatizable ?? false,
        });
      }

      toast.success("Proceso guardado correctamente");
      setModalNuevo(null);
      setTab("templates");
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar el proceso");
      setModalNuevo((prev) => prev ? { ...prev, guardando: false } : null);
    }
  };

  const abrirModalNuevo = () => {
    setModalNuevo({ modo: "ia", descripcion: "", nombre: "", loading: false, resultado: null, guardando: false });
  };

  const handleGenerarDesdeDescripcion = async () => {
    if (!modalNuevo?.descripcion.trim()) return;
    setModalNuevo((prev) => prev ? { ...prev, loading: true, resultado: null } : null);
    try {
      const resultado = await procesosApi.optimizarDesdeDescripcion(modalNuevo!.descripcion);
      setModalNuevo((prev) => prev ? { ...prev, loading: false, resultado } : null);
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar el proceso con IA");
      setModalNuevo((prev) => prev ? { ...prev, loading: false } : null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Procesos"
        description="Templates y flujos de trabajo activos"
        actions={
          <button
            onClick={abrirModalNuevo}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo template
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {([
          { value: "activas", label: `En progreso (${instancias.length})` },
          { value: "templates", label: `Templates (${procesos.length})` },
          { value: "automatizaciones", label: `Automatizaciones IA (${autoPythonActivas.length})` },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === value ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingCard count={4} />
      ) : errorCarga ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Error al cargar los procesos</p>
            <p className="text-xs text-red-500">{errorCarga}</p>
          </div>
          <button
            onClick={() => cargar()}
            className="ml-auto text-xs text-red-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : tab === "activas" ? (
        instancias.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="Sin procesos activos"
            description="Iniciá un proceso desde un template para comenzar a gestionar flujos de trabajo"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instancias.map((inst) => {
              const pasosCompletados = inst.pasos?.filter((p) => p.estado === "completado").length ?? inst.pasos_completados ?? 0;
              const pasosTotal = inst.pasos?.length ?? inst.pasos_total ?? 0;
              // Find template name from loaded procesos list
              const templateNombre = procesos.find((p) => p.id === inst.template_id)?.nombre
                ?? inst.proceso_nombre
                ?? `Proceso #${inst.template_id}`;
              return (
              <div key={inst.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{templateNombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inst.cliente_nombre ?? (inst.cliente_id ? `Cliente #${inst.cliente_id}` : "Sin cliente")}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    inst.estado === "en_progreso" ? "bg-blue-100 text-blue-700" :
                    inst.estado === "completado" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    {inst.estado === "en_progreso" ? "EN PROGRESO" : inst.estado.toUpperCase()}
                  </span>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{pasosCompletados} de {pasosTotal} pasos</span>
                    <span className="font-medium">{inst.progreso_pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        inst.progreso_pct >= 75 ? "bg-green-500" :
                        inst.progreso_pct >= 40 ? "bg-blue-500" : "bg-amber-400"
                      )}
                      style={{ width: `${inst.progreso_pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Iniciado: {formatFecha(inst.fecha_inicio)}</span>
                  <Link
                    href={`/procesos/${inst.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                  >
                    Ver detalle <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        )
      ) : tab === "templates" ? (
        procesos.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="Sin templates"
            description="Creá tu primer template para estandarizar los procesos del estudio"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {procesos.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 transition-colors flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.descripcion}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase ml-2 shrink-0">
                    {p.tipo}
                  </span>
                </div>

                {/* Pasos preview */}
                {p.pasos && p.pasos.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {p.pasos.slice(0, 3).map((paso) => (
                      <div key={paso.id} className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                          {paso.orden}
                        </div>
                        <span className="text-gray-600 truncate">{paso.titulo ?? paso.nombre}</span>
                      </div>
                    ))}
                    {p.pasos.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-6">+{p.pasos.length - 3} pasos más</p>
                    )}
                  </div>
                )}

                {/* Botones IA */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  <button
                    onClick={() => ejecutarAccionIA("optimizar_ia", p)}
                    className="col-span-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    title="Comparar versión original vs IA y elegir"
                  >
                    <Sparkles className="h-3 w-3 shrink-0" />
                    Optimizar con IA (original vs IA)
                  </button>
                  <button
                    onClick={() => ejecutarAccionIA("analizar_automatizabilidad", p)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-medium rounded-lg hover:bg-purple-100 transition-colors"
                    title="Detectar pasos automatizables con IA"
                  >
                    <Zap className="h-3 w-3 shrink-0" />
                    Detectar automáticas
                  </button>
                  <button
                    onClick={() => ejecutarAccionIA("generar_n8n", p)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-700 text-[11px] font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                    title="Generar flujo n8n"
                  >
                    <Bot className="h-3 w-3 shrink-0" />
                    Generar n8n
                  </button>
                  <button
                    onClick={() => ejecutarAccionIA("generar_sop", p)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-teal-50 text-teal-700 text-[11px] font-medium rounded-lg hover:bg-teal-100 transition-colors"
                    title="Crear SOP en PDF"
                  >
                    <FileText className="h-3 w-3 shrink-0" />
                    Crear SOP
                  </button>
                  <button
                    onClick={() => ejecutarAccionIA("documentar_ia", p)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-amber-50 text-amber-700 text-[11px] font-medium rounded-lg hover:bg-amber-100 transition-colors"
                    title="Mejorar documentación con IA"
                  >
                    <Sparkles className="h-3 w-3 shrink-0" />
                    Mejorar con IA
                  </button>
                </div>
                {(p as any).tiene_version_anterior && (
                  <button
                    onClick={() => handleRestaurarVersionAnterior(p.id)}
                    className="w-full mb-2 flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[11px] font-medium rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                  >
                    ↩ Restaurar versión anterior
                  </button>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {p.activo ? "Activo" : "Inactivo"}
                  </span>
                  <button
                    onClick={() => abrirModal(p)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Usar template →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        autoPythonActivas.length === 0 ? (
          <EmptyState
            icon={Bot}
            title="Sin automatizaciones activas"
            description="Activá una automatización Python desde la sección Automatizaciones para verla aquí"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {autoPythonActivas.map((auto) => (
              <div key={auto.id} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{auto.nombre}</p>
                    {auto.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{auto.descripcion}</p>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                    ACTIVA
                  </span>
                </div>
                <div className="mt-auto pt-2 border-t border-gray-50 flex justify-end">
                  <Link
                    href="/automatizaciones"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                  >
                    Ver en Automatizaciones <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Modal Iniciar Proceso ── */}
      {modalProceso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Iniciar proceso</h2>
                <p className="text-xs text-gray-400 mt-0.5">{modalProceso.nombre}</p>
              </div>
              <button onClick={() => setModalProceso(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Seleccionar cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 bg-white"
              >
                <option value="">— Elegir cliente —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalProceso(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleIniciar}
                disabled={!clienteId || iniciando}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {iniciando ? "Iniciando..." : "Iniciar proceso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal IA ── */}
      {modalIA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {modalIA.tipo === "analizar_automatizabilidad" && "Detectar pasos automatizables"}
                  {modalIA.tipo === "generar_n8n" && "Flujo n8n generado"}
                  {modalIA.tipo === "generar_sop" && "SOP generado"}
                  {modalIA.tipo === "documentar_ia" && "Mejora con IA"}
                  {modalIA.tipo === "optimizar_ia" && "Optimización IA — original vs IA"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{modalIA.template.nombre}</p>
              </div>
              <button onClick={() => setModalIA(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {modalIA.loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-500">Procesando con IA...</p>
                </div>
              ) : modalIA.error ? (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-4">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{modalIA.error}</p>
                </div>
              ) : modalIA.tipo === "analizar_automatizabilidad" ? (
                <ResultadoAnalisis data={modalIA.resultado} />
              ) : modalIA.tipo === "generar_n8n" ? (
                <ResultadoN8n data={modalIA.resultado} />
              ) : modalIA.tipo === "generar_sop" ? (
                <ResultadoSop data={modalIA.resultado} />
              ) : modalIA.tipo === "optimizar_ia" ? (
                <ResultadoOptimizarIA
                  data={modalIA.resultado}
                  onAplicar={handleAplicarOptimizacion}
                  onRestaurar={() => handleRestaurarVersionAnterior(modalIA.template.id)}
                  aplicando={aplicandoOpt}
                  tieneVersionAnterior={(modalIA.template as any).tiene_version_anterior ?? false}
                />
              ) : (
                <ResultadoDocumentarIA data={modalIA.resultado} />
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setModalIA(null)}
                className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nuevo Template ── */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Nuevo template</h2>
                <p className="text-xs text-gray-400 mt-0.5">Describí el proceso y la IA lo estructura automáticamente</p>
              </div>
              <button onClick={() => setModalNuevo(null)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {!modalNuevo.resultado ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Describí el proceso <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={modalNuevo.descripcion}
                      onChange={(e) => setModalNuevo((prev) => prev ? { ...prev, descripcion: e.target.value } : null)}
                      rows={5}
                      placeholder="Ej: Proceso de cierre mensual de IVA: recopilamos facturas del cliente, las cargamos en el sistema, calculamos el saldo, presentamos la declaración y notificamos al cliente..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleGenerarDesdeDescripcion}
                    disabled={!modalNuevo.descripcion.trim() || modalNuevo.loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {modalNuevo.loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generando con IA...</>
                    ) : (
                      <><Sparkles className="h-4 w-4" /> Generar con IA</>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-green-800 text-sm font-medium">Template generado — revisá antes de guardar</span>
                  </div>
                  <ResultadoDocumentarIA data={modalNuevo.resultado} />
                  <button
                    onClick={() => setModalNuevo((prev) => prev ? { ...prev, resultado: null } : null)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    ← Volver a editar descripción
                  </button>
                </>
              )}
            </div>

            {modalNuevo.resultado && (
              <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
                <button
                  onClick={() => setModalNuevo(null)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarTemplateIA}
                  disabled={modalNuevo.guardando}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {modalNuevo.guardando ? "Guardando..." : "Guardar template"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
