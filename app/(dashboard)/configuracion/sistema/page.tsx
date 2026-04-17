"use client";

import { useState, useEffect, useCallback } from "react";
import { Cpu, CheckCircle2, XCircle, Loader2, RefreshCw, Bot, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface EstadoSistema {
  claude: { ok: boolean; mensaje: string };
  afip: { ok: boolean; mensaje: string };
  email: { ok: boolean; mensaje: string };
  telegram: { ok: boolean; mensaje: string };
  portal: { ok: boolean; mensaje: string };
  db: { ok: boolean; mensaje: string };
}

interface ConfigSistema {
  claude_api_key: string;
  claude_modelo: string;
  debug_activo: boolean;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

const MODELOS_CLAUDE = [
  { value: "claude-opus-4-6", label: "Claude Opus 4.6 (más potente)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (equilibrado)" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (más rápido)" },
];

const COMPONENTE_LABELS: Record<string, string> = {
  claude: "Anthropic Claude (IA)",
  afip: "AFIP / ARCA",
  email: "Correo (SMTP/Gmail)",
  telegram: "Telegram Bot",
  portal: "Portal del cliente",
  db: "Base de datos",
};

function ComponenteEstado({ nombre, estado }: { nombre: string; estado: { ok: boolean; mensaje: string } }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        {estado.ok
          ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
        <span className="text-sm text-gray-700">{COMPONENTE_LABELS[nombre] ?? nombre}</span>
      </div>
      <span className={`text-xs ${estado.ok ? "text-green-600" : "text-red-500"}`}>
        {estado.mensaje}
      </span>
    </div>
  );
}

function SecretKeyInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const isMasked = value.startsWith("••••");
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={isMasked ? "" : value}
          onChange={e => onChange(e.target.value)}
          placeholder={isMasked ? "••••••••  (configurado)" : placeholder}
          className={`${INPUT} pr-10`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function SistemaPage() {
  const toast = useToast();
  const [estado, setEstado] = useState<EstadoSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [config, setConfig] = useState<ConfigSistema>({
    claude_api_key: "",
    claude_modelo: "claude-sonnet-4-6",
    debug_activo: false,
  });
  const [saving, setSaving] = useState(false);
  const [testando, setTestando] = useState(false);

  const cargarEstado = useCallback(async () => {
    try {
      const data = await apiFetch<EstadoSistema>("/config/sistema/estado");
      setEstado(data);
    } catch {
      toast.error("Error al cargar estado del sistema");
    }
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [estadoData, configData] = await Promise.all([
        apiFetch<EstadoSistema>("/config/sistema/estado"),
        apiFetch<ConfigSistema>("/config/sistema").catch(() => null),
      ]);
      setEstado(estadoData);
      if (configData) setConfig(prev => ({ ...prev, ...configData }));
    } catch {
      toast.error("Error al cargar configuración del sistema");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleRecargar = async () => {
    setRecargando(true);
    await cargarEstado();
    setRecargando(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        claude_modelo: config.claude_modelo,
        debug_activo: config.debug_activo,
      };
      if (config.claude_api_key && !config.claude_api_key.startsWith("••••")) {
        payload.claude_api_key = config.claude_api_key;
      }
      await apiFetch("/config/sistema", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success("Configuración del sistema guardada");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleTestClaude = async () => {
    setTestando(true);
    try {
      const result = await apiFetch<{ ok: boolean; mensaje: string }>("/config/sistema/test-claude", { method: "POST" });
      if (result.ok) {
        toast.success(result.mensaje ?? "Claude responde correctamente");
      } else {
        toast.error(result.mensaje ?? "Error en test de Claude");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error al testear Claude");
    } finally {
      setTestando(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Sistema</h2>
        <p className="text-sm text-gray-500 mt-1">Estado de los componentes del sistema y configuración avanzada.</p>
      </div>

      {/* Estado de componentes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Estado de componentes</h3>
          </div>
          <button
            type="button"
            onClick={handleRecargar}
            disabled={recargando}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${recargando ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
        {estado ? (
          <div>
            {Object.entries(estado).map(([nombre, comp]) => (
              <ComponenteEstado key={nombre} nombre={nombre} estado={comp} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Sin datos de estado</p>
        )}
      </div>

      {/* Claude / IA */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-800">Anthropic Claude (IA)</h3>
        </div>
        <SecretKeyInput
          label="API Key de Anthropic"
          value={config.claude_api_key}
          onChange={v => setConfig(c => ({ ...c, claude_api_key: v }))}
          placeholder="sk-ant-api03-..."
        />
        <div>
          <label className={LABEL}>Modelo</label>
          <select
            className={INPUT}
            value={config.claude_modelo}
            onChange={e => setConfig(c => ({ ...c, claude_modelo: e.target.value }))}
          >
            {MODELOS_CLAUDE.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            type="button"
            onClick={handleTestClaude}
            disabled={testando}
            className="flex items-center gap-2 px-4 py-2 border border-purple-200 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 disabled:opacity-50 transition-colors"
          >
            {testando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
            {testando ? "Testeando..." : "Testear conexión Claude"}
          </button>
        </div>
      </div>

      {/* Opciones avanzadas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Opciones avanzadas</h3>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.debug_activo}
            onChange={e => setConfig(c => ({ ...c, debug_activo: e.target.checked }))}
            className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Modo debug</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Activa logs detallados en el backend. No recomendado en producción.
            </p>
          </div>
        </label>
      </div>

      {/* Info del sistema */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Información del sistema</p>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span className="text-gray-400">Versión</span>
            <span>PyME OS v1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Backend URL</span>
            <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL ?? "localhost:8000"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
