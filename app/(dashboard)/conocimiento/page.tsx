"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  BookOpen, Search, FileText, Zap, Code2, ChevronDown, ChevronUp,
  AlertCircle, Loader2, Clock, Eye, EyeOff, Tag, RefreshCw,
  ListChecks, Globe, Terminal,
} from "lucide-react";
import { conocimientoApi } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SopItem {
  id: number;
  titulo: string;
  area?: string;
  descripcion_proposito?: string;
  resultado_esperado?: string;
  pasos_count?: number;
  version?: number;
  proceso_template_id?: number;
  tipo?: string;
  url?: string;
}

interface AutoN8nItem {
  id: number;
  nombre: string;
  template_nombre?: string;
  herramienta?: string;
  ahorro_horas_mes?: number;
  aprobado_at?: string;
  flujo_json?: Record<string, unknown>;
}

interface AutoPythonItem {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  nodos_count?: number;
  tiene_codigo?: boolean;
}

interface SearchResult {
  tipo: string;
  id: number;
  titulo: string;
  descripcion?: string;
  area?: string;
  herramienta?: string;
  template_nombre?: string;
}

// ─── Area badge ───────────────────────────────────────────────────────────────

const AREA_COLORS: Record<string, string> = {
  impuestos:    "bg-blue-100 text-blue-700",
  laboral:      "bg-green-100 text-green-700",
  societario:   "bg-purple-100 text-purple-700",
  contabilidad: "bg-teal-100 text-teal-700",
  administracion: "bg-orange-100 text-orange-700",
};

function AreaBadge({ area }: { area?: string }) {
  if (!area) return null;
  const cls = AREA_COLORS[area.toLowerCase()] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", cls)}>
      {area}
    </span>
  );
}

// ─── SOP Card ─────────────────────────────────────────────────────────────────

function SopCard({ sop }: { sop: SopItem }) {
  const [expanded, setExpanded] = useState(false);
  const [detalle, setDetalle] = useState<any>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !detalle) {
      setLoadingDetalle(true);
      try {
        const d = await conocimientoApi.obtenerSop(sop.id);
        setDetalle(d);
      } catch {}
      finally { setLoadingDetalle(false); }
    }
    setExpanded((e) => !e);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-gray-900">{sop.titulo}</p>
            <AreaBadge area={sop.area} />
            {sop.version && sop.version > 1 && (
              <span className="text-[10px] text-gray-400">v{sop.version}</span>
            )}
          </div>
          {sop.descripcion_proposito && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{sop.descripcion_proposito}</p>
          )}
          <div className="flex items-center gap-3 mt-1">
            {sop.pasos_count != null && (
              <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                <ListChecks className="h-3 w-3" />
                {sop.pasos_count} paso{sop.pasos_count !== 1 ? "s" : ""}
              </p>
            )}
            {sop.url && (
              <a
                href={sop.url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${sop.url}` : sop.url}
                target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
                <Globe className="h-3 w-3" /> Ver PDF
              </a>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
          : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 space-y-3 pt-3">
          {loadingDetalle && <Loader2 className="h-4 w-4 animate-spin text-gray-300 mx-auto" />}
          {detalle && (
            <>
              {detalle.resultado_esperado && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Resultado esperado</p>
                  <p className="text-xs text-gray-600">{detalle.resultado_esperado}</p>
                </div>
              )}
              {detalle.pasos && detalle.pasos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Pasos</p>
                  <ol className="space-y-1.5">
                    {detalle.pasos.map((p: any, i: number) => (
                      <li key={i} className="flex gap-2 text-xs text-gray-600">
                        <span className="text-gray-400 font-medium shrink-0">{p.orden ?? i + 1}.</span>
                        <div>
                          <span className="font-medium">{p.titulo ?? p.descripcion}</span>
                          {p.descripcion && p.titulo && (
                            <p className="text-gray-400 mt-0.5">{p.descripcion}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── n8n Card ─────────────────────────────────────────────────────────────────

function AutoN8nCard({ auto }: { auto: AutoN8nItem }) {
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
          </div>
          {auto.template_nombre && (
            <p className="text-xs text-gray-400 mt-0.5">Proceso: {auto.template_nombre}</p>
          )}
          {auto.ahorro_horas_mes != null && (
            <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-1">
              <Clock className="h-3 w-3" /> {auto.ahorro_horas_mes}h/mes ahorradas
            </p>
          )}
        </div>
        {auto.flujo_json && (
          <button
            onClick={() => setShowJson((s) => !s)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
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

// ─── Python Card ──────────────────────────────────────────────────────────────

function AutoPythonCard({ auto }: { auto: AutoPythonItem }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-3">
      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Code2 className="h-4 w-4 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{auto.nombre}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Python</span>
          {auto.estado === "activo" && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Activo</span>
          )}
          {auto.tiene_codigo && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
              <Terminal className="h-2.5 w-2.5" /> Código listo
            </span>
          )}
        </div>
        {auto.descripcion && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{auto.descripcion}</p>
        )}
        {auto.nodos_count != null && (
          <p className="text-[10px] text-gray-400 mt-1">{auto.nodos_count} nodo{auto.nodos_count !== 1 ? "s" : ""}</p>
        )}
      </div>
    </div>
  );
}

// ─── Search Result ────────────────────────────────────────────────────────────

function SearchResultCard({ result }: { result: SearchResult }) {
  const icons: Record<string, React.ReactNode> = {
    sop: <FileText className="h-4 w-4 text-blue-500" />,
    "sop_asistido": <FileText className="h-4 w-4 text-blue-500" />,
    n8n: <Zap className="h-4 w-4 text-amber-500" />,
    python: <Code2 className="h-4 w-4 text-purple-500" />,
  };
  const bgColors: Record<string, string> = {
    sop: "bg-blue-100",
    sop_asistido: "bg-blue-100",
    n8n: "bg-amber-100",
    python: "bg-purple-100",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start gap-3">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bgColors[result.tipo] ?? "bg-gray-100")}>
        {icons[result.tipo] ?? <BookOpen className="h-4 w-4 text-gray-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{result.titulo}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wider">
            {result.tipo === "sop_asistido" ? "SOP" : result.tipo}
          </span>
          <AreaBadge area={result.area} />
        </div>
        {result.descripcion && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{result.descripcion}</p>
        )}
        {result.template_nombre && (
          <p className="text-[10px] text-gray-400 mt-0.5">Proceso: {result.template_nombre}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "sops" | "n8n" | "python";

export default function ConocimientoPage() {
  const [tab, setTab] = useState<Tab>("sops");
  const [sops, setSops] = useState<SopItem[]>([]);
  const [autosN8n, setAutosN8n] = useState<AutoN8nItem[]>([]);
  const [autosPython, setAutosPython] = useState<AutoPythonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [areaFilter, setAreaFilter] = useState("");
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, n, p] = await Promise.all([
        conocimientoApi.listarSops().catch(() => []),
        conocimientoApi.listarAutomatizaciones().catch(() => []),
        conocimientoApi.listarAutomatizacionesPython().catch(() => []),
      ]);
      setSops(s as SopItem[]);
      setAutosN8n(n as AutoN8nItem[]);
      setAutosPython(p as AutoPythonItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar conocimiento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await conocimientoApi.buscar(query.trim());
        setSearchResults(res.resultados ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, [query]);

  // Filtered sops by area
  const filteredSops = areaFilter
    ? sops.filter((s) => s.area?.toLowerCase() === areaFilter.toLowerCase())
    : sops;

  const areas = Array.from(new Set(sops.map((s) => s.area).filter(Boolean))) as string[];

  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Centro de Conocimientos</h1>
        <p className="text-sm text-gray-400 mt-0.5">SOPs, automatizaciones n8n y flujos Python del estudio</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en todo el conocimiento..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
        />
        {searching && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Search results */}
      {isSearching ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            {searchResults === null
              ? "Buscando..."
              : `${searchResults.length} resultado${searchResults.length !== 1 ? "s" : ""} para "${query}"`}
          </p>
          {searchResults && searchResults.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <BookOpen className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin resultados</p>
            </div>
          )}
          {searchResults?.map((r, i) => <SearchResultCard key={i} result={r} />)}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab("sops")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                tab === "sops" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              SOPs
              {sops.length > 0 && (
                <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                  {sops.length}
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
              Automatizaciones n8n
              {autosN8n.length > 0 && (
                <span className="ml-1 text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">
                  {autosN8n.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("python")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                tab === "python" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              Python
              {autosPython.length > 0 && (
                <span className="ml-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">
                  {autosPython.length}
                </span>
              )}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
            </div>
          )}

          {/* SOPs tab */}
          {!loading && tab === "sops" && (
            <div className="space-y-3">
              {areas.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-3.5 w-3.5 text-gray-400" />
                  <button
                    onClick={() => setAreaFilter("")}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                      !areaFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    Todas
                  </button>
                  {areas.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAreaFilter(a === areaFilter ? "" : a)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium capitalize transition-colors",
                        areaFilter === a ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
              {filteredSops.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                  <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Sin SOPs publicados</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Generá un SOP desde la sección Procesos → plantilla → Generar SOP
                  </p>
                </div>
              ) : (
                filteredSops.map((s) => <SopCard key={s.id} sop={s} />)
              )}
            </div>
          )}

          {/* n8n tab */}
          {!loading && tab === "n8n" && (
            <div className="space-y-3">
              {autosN8n.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                  <Zap className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Sin automatizaciones n8n aprobadas</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Aprobá automatizaciones desde Procesos → plantilla → Generar n8n
                  </p>
                </div>
              ) : (
                autosN8n.map((a) => <AutoN8nCard key={a.id} auto={a} />)
              )}
            </div>
          )}

          {/* Python tab */}
          {!loading && tab === "python" && (
            <div className="space-y-3">
              {autosPython.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                  <Code2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Sin automatizaciones Python</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Creá una desde la sección Automatizaciones
                  </p>
                </div>
              ) : (
                autosPython.map((a) => <AutoPythonCard key={a.id} auto={a} />)
              )}
            </div>
          )}
        </>
      )}

      {/* Refresh */}
      {!loading && !isSearching && (
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
