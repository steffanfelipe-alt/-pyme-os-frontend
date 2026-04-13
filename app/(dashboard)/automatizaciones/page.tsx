"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Zap, Plus, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Code2, Play, Settings2, CheckCircle2, Clock, ArrowRight,
  Wand2, Terminal, Eye, EyeOff, RefreshCw, Archive,
} from "lucide-react";
import {
  automatizacionesApi, automatizacionesPythonApi,
  type AutomatizacionPython, type NodoPython, type InputPendiente,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

// ─── Node type styles ──────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  trigger:      "bg-green-100 text-green-700 border-green-200",
  http_request: "bg-blue-100 text-blue-700 border-blue-200",
  transform:    "bg-purple-100 text-purple-700 border-purple-200",
  filter:       "bg-amber-100 text-amber-700 border-amber-200",
  notify:       "bg-orange-100 text-orange-700 border-orange-200",
  code:         "bg-gray-100 text-gray-700 border-gray-200",
  delay:        "bg-slate-100 text-slate-700 border-slate-200",
  condition:    "bg-yellow-100 text-yellow-700 border-yellow-200",
  db_query:     "bg-teal-100 text-teal-700 border-teal-200",
  file_read:    "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const NODE_LABELS: Record<string, string> = {
  trigger:      "Trigger",
  http_request: "HTTP",
  transform:    "Transformar",
  filter:       "Filtrar",
  notify:       "Notificar",
  code:         "Código",
  delay:        "Espera",
  condition:    "Condición",
  db_query:     "DB Query",
  file_read:    "Archivo",
};

// ─── Mini canvas (node graph visual) ─────────────────────────────────────────

function NodeGraph({ nodos, conexiones }: { nodos: NodoPython[]; conexiones: { from_node: string; to_node: string; label: string | null }[] }) {
  if (!nodos || nodos.length === 0) return null;

  // Simple left-to-right layout sorted by position.x
  const sorted = [...nodos].sort((a, b) => a.position.x - b.position.x);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-1 py-2 min-w-max">
        {sorted.map((node, idx) => {
          const colorCls = NODE_COLORS[node.type] ?? "bg-gray-100 text-gray-700 border-gray-200";
          const label = NODE_LABELS[node.type] ?? node.type;
          const hasInputs = node.required_inputs?.length > 0;
          return (
            <div key={node.id} className="flex items-center gap-1">
              <div className={cn(
                "flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium min-w-[80px] text-center",
                colorCls
              )}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{label}</span>
                <span className="truncate max-w-[90px]">{node.name}</span>
                {hasInputs && (
                  <span className="mt-1 flex items-center gap-0.5 text-[10px] opacity-70">
                    <Settings2 className="h-2.5 w-2.5" />
                    {node.required_inputs.length} input{node.required_inputs.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {idx < sorted.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
      {conexiones && conexiones.length > 0 && (
        <p className="text-[10px] text-gray-400 mt-1">
          {conexiones.length} conexión{conexiones.length > 1 ? "es" : ""}
        </p>
      )}
    </div>
  );
}

// ─── Configure Inputs modal ───────────────────────────────────────────────────

function ConfigurarInputsModal({
  pendientes,
  onGuardar,
  onClose,
  saving,
}: {
  pendientes: InputPendiente[];
  onGuardar: (vals: Record<string, Record<string, string>>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [vals, setVals] = useState<Record<string, Record<string, string>>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});

  const setVal = (nodeId: string, campo: string, v: string) => {
    setVals((p) => ({ ...p, [nodeId]: { ...(p[nodeId] ?? {}), [campo]: v } }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Configurar inputs requeridos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Completá los datos necesarios para ejecutar la automatización</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {pendientes.map((p) => (
            <div key={p.node_id}>
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                  NODE_COLORS[p.node_type] ?? "bg-gray-100 text-gray-600 border-gray-200"
                )}>{NODE_LABELS[p.node_type] ?? p.node_type}</span>
                {p.node_name}
              </p>
              <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                {p.campos.map((c) => (
                  <div key={c.campo}>
                    <label className="text-[11px] font-medium text-gray-600">{c.label}</label>
                    {c.tipo === "select" && c.opciones ? (
                      <select
                        value={vals[p.node_id]?.[c.campo] ?? ""}
                        onChange={(e) => setVal(p.node_id, c.campo, e.target.value)}
                        className="mt-1 w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Seleccionar...</option>
                        {c.opciones.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="relative mt-1">
                        <input
                          type={c.tipo === "password" && !show[`${p.node_id}_${c.campo}`] ? "password" : "text"}
                          value={vals[p.node_id]?.[c.campo] ?? ""}
                          onChange={(e) => setVal(p.node_id, c.campo, e.target.value)}
                          placeholder={c.tipo === "password" ? "••••••••" : `Ingresá ${c.label.toLowerCase()}`}
                          className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none pr-8"
                        />
                        {c.tipo === "password" && (
                          <button
                            type="button"
                            onClick={() => setShow((s) => ({ ...s, [`${p.node_id}_${c.campo}`]: !s[`${p.node_id}_${c.campo}`] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                          >
                            {show[`${p.node_id}_${c.campo}`] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => onGuardar(vals)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Python automation card ───────────────────────────────────────────────────

function AutoPythonCard({
  auto,
  onRefresh,
}: {
  auto: AutomatizacionPython;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [activando, setActivando] = useState(false);
  const [loadingInputs, setLoadingInputs] = useState(false);
  const [pendientes, setPendientes] = useState<InputPendiente[] | null>(null);
  const [guardandoInputs, setGuardandoInputs] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerarCodigo = async () => {
    setGenerando(true);
    setError(null);
    try {
      await automatizacionesPythonApi.generarCodigo(auto.id);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando código");
    } finally {
      setGenerando(false);
    }
  };

  const handleVerInputs = async () => {
    setLoadingInputs(true);
    setError(null);
    try {
      const inputs = await automatizacionesPythonApi.obtenerInputsPendientes(auto.id);
      setPendientes(inputs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando inputs");
    } finally {
      setLoadingInputs(false);
    }
  };

  const handleGuardarInputs = async (vals: Record<string, Record<string, string>>) => {
    setGuardandoInputs(true);
    try {
      await automatizacionesPythonApi.configurarInputs(auto.id, vals);
      setPendientes(null);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error guardando inputs");
    } finally {
      setGuardandoInputs(false);
    }
  };

  const handleActivar = async () => {
    setActivando(true);
    setError(null);
    try {
      await automatizacionesPythonApi.activar(auto.id);
      toast.success(`Automatización "${auto.nombre}" activada`);
      onRefresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al activar";
      setError(msg);
      toast.error(msg);
    } finally {
      setActivando(false);
    }
  };

  const estadoBadge = {
    borrador: "bg-gray-100 text-gray-600",
    activo:   "bg-green-100 text-green-700",
    archivado:"bg-red-100 text-red-600",
  }[auto.estado] ?? "bg-gray-100 text-gray-600";

  const nodos = auto.nodos ?? [];
  const conexiones = auto.conexiones ?? [];
  const hasInputsConfig = nodos.some(n => n.required_inputs?.length > 0);

  return (
    <>
      {pendientes && (
        <ConfigurarInputsModal
          pendientes={pendientes}
          onGuardar={handleGuardarInputs}
          onClose={() => setPendientes(null)}
          saving={guardandoInputs}
        />
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <Code2 className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-gray-900">{auto.nombre}</p>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", estadoBadge)}>
                {auto.estado}
              </span>
              {auto.codigo_generado && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Código listo
                </span>
              )}
            </div>
            {auto.descripcion && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{auto.descripcion}</p>
            )}
            <p className="text-[10px] text-gray-300 mt-1">
              {nodos.length} nodo{nodos.length !== 1 ? "s" : ""} · {conexiones.length} conexión{conexiones.length !== 1 ? "es" : ""}
            </p>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-1" />}
        </button>

        {expanded && (
          <div className="px-5 pb-5 border-t border-gray-50 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mt-3">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}

            {/* Graph */}
            {nodos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Grafo de nodos</p>
                <div className="bg-gray-50 rounded-xl p-3 overflow-x-auto">
                  <NodeGraph nodos={nodos} conexiones={conexiones} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {auto.estado === "borrador" && (
                <button
                  onClick={handleActivar}
                  disabled={activando}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  {activando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  {activando ? "Activando..." : "Activar"}
                </button>
              )}
              {hasInputsConfig && (
                <button
                  onClick={handleVerInputs}
                  disabled={loadingInputs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  {loadingInputs ? <Loader2 className="h-3 w-3 animate-spin" /> : <Settings2 className="h-3 w-3" />}
                  Configurar inputs
                </button>
              )}
              <button
                onClick={handleGenerarCodigo}
                disabled={generando}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {generando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Terminal className="h-3 w-3" />}
                {generando ? "Generando..." : auto.codigo_generado ? "Regenerar código" : "Generar código Python"}
              </button>
              {auto.codigo_generado && (
                <button
                  onClick={() => setShowCode((s) => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showCode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showCode ? "Ocultar código" : "Ver código"}
                </button>
              )}
            </div>

            {/* Code block */}
            {showCode && auto.codigo_generado && (
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {auto.codigo_generado}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── n8n automation card ──────────────────────────────────────────────────────

function AutoN8nCard({ auto }: { auto: any }) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{auto.nombre}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">n8n</span>
            {auto.aprobado && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aprobado</span>
            )}
          </div>
          {auto.template_nombre && (
            <p className="text-xs text-gray-400 mt-0.5">Proceso: {auto.template_nombre}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {auto.ahorro_horas_mes != null && (
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {auto.ahorro_horas_mes}h/mes ahorradas
              </p>
            )}
            {auto.herramienta && (
              <p className="text-[10px] text-gray-400">{auto.herramienta}</p>
            )}
          </div>
        </div>
        {auto.flujo_json && (
          <button
            onClick={() => setShowJson((s) => !s)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
          >
            {showJson ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            JSON
          </button>
        )}
      </div>
      {showJson && auto.flujo_json && (
        <div className="border-t border-gray-100 bg-gray-900 p-4 overflow-x-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(auto.flujo_json, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "python" | "n8n";
type FiltroEstado = "todos" | "borrador" | "activo" | "archivado";

export default function AutomatizacionesPage() {
  const [tab, setTab] = useState<Tab>("python");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [autosPython, setAutosPython] = useState<AutomatizacionPython[]>([]);
  const [autosN8n, setAutosN8n] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generar desde descripción
  const [showGenerar, setShowGenerar] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [nombre, setNombre] = useState("");
  const [generando, setGenerando] = useState(false);
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [python, n8n] = await Promise.all([
        automatizacionesPythonApi.listar().catch(() => []),
        automatizacionesApi.listarPendientes?.().catch(() => []) ?? Promise.resolve([]),
      ]);
      setAutosPython(python as AutomatizacionPython[]);
      setAutosN8n(n8n as any[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar automatizaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGenerarDesdeDescripcion = async () => {
    if (!descripcion.trim()) return;
    setGenerando(true);
    setErrorGenerar(null);
    try {
      await automatizacionesPythonApi.generarDesdeDescripcion(descripcion.trim(), nombre.trim() || undefined);
      setDescripcion("");
      setNombre("");
      setShowGenerar(false);
      await cargar();
    } catch (e) {
      setErrorGenerar(e instanceof Error ? e.message : "Error al generar automatización");
    } finally {
      setGenerando(false);
    }
  };

  const filtradosPython = autosPython.filter(
    (a) => filtroEstado === "todos" || a.estado === filtroEstado
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Automatizaciones</h1>
          <p className="text-sm text-gray-400 mt-0.5">Flujos Python visuales y automatizaciones n8n del estudio</p>
        </div>
        {tab === "python" && (
          <button
            onClick={() => setShowGenerar((s) => !s)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shrink-0"
          >
            <Wand2 className="h-4 w-4" />
            Generar con IA
          </button>
        )}
      </div>

      {/* Generate panel */}
      {showGenerar && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-purple-800">Nueva automatización Python desde descripción</p>
          <div>
            <label className="text-xs font-medium text-purple-700 mb-1 block">Nombre (opcional)</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Notificar vencimientos AFIP"
              className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-purple-700 mb-1 block">Descripción de lo que debe hacer</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Ej: Cada día a las 9am, consultar la API de AFIP para verificar vencimientos de los próximos 5 días y enviar un resumen por Telegram al contador."
              className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg bg-white focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>
          {errorGenerar && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {errorGenerar}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowGenerar(false); setErrorGenerar(null); }}
              className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerarDesdeDescripcion}
              disabled={generando || !descripcion.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {generando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              {generando ? "Generando grafo..." : "Generar"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("python")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            tab === "python" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Code2 className="h-3.5 w-3.5" />
          Python Visual
          {autosPython.length > 0 && (
            <span className="ml-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">
              {autosPython.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("n8n")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
            tab === "n8n" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          n8n
          {autosN8n.length > 0 && (
            <span className="ml-1 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">
              {autosN8n.length}
            </span>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      )}

      {/* Python tab */}
      {!loading && tab === "python" && (
        <div className="space-y-3">
          {autosPython.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <Code2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Sin automatizaciones Python</p>
              <p className="text-xs text-gray-400 mt-1">Generá una desde la descripción con IA</p>
              <button
                onClick={() => setShowGenerar(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors mx-auto"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Generar con IA
              </button>
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {(["todos", "borrador", "activo", "archivado"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltroEstado(f)}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                      filtroEstado === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {f === "todos" ? "Todos" : f}
                    <span className="ml-1 text-[10px] opacity-60">
                      ({f === "todos" ? autosPython.length : autosPython.filter(a => a.estado === f).length})
                    </span>
                  </button>
                ))}
              </div>

              {filtradosPython.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <p className="text-sm text-gray-400">Sin automatizaciones en estado "{filtroEstado}"</p>
                </div>
              ) : (
                filtradosPython.map((a) => (
                  <AutoPythonCard key={a.id} auto={a} onRefresh={cargar} />
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* n8n tab */}
      {!loading && tab === "n8n" && (
        <div className="space-y-3">
          {autosN8n.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <Zap className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Sin automatizaciones n8n</p>
              <p className="text-xs text-gray-400 mt-1">Generá un flujo n8n desde un proceso en la sección Procesos</p>
            </div>
          ) : (
            autosN8n.map((a) => <AutoN8nCard key={a.id} auto={a} />)
          )}
        </div>
      )}

      {/* Refresh */}
      {!loading && (
        <button
          onClick={cargar}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mx-auto"
        >
          <RefreshCw className="h-3 w-3" />
          Actualizar
        </button>
      )}
    </div>
  );
}
