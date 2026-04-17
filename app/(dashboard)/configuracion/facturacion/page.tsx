"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Upload, CheckCircle2, AlertCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface EstadoAfip {
  configurado: boolean;
  cuit: string | null;
  punto_venta: number | null;
  modo: string;
  cert_expiry: string | null;
}

interface ConfigAfip {
  cuit: string;
  punto_venta: number;
  modo: string;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

export default function FacturacionPage() {
  const toast = useToast();
  const [estado, setEstado] = useState<EstadoAfip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testando, setTestando] = useState(false);
  const [config, setConfig] = useState<ConfigAfip>({ cuit: "", punto_venta: 1, modo: "homologacion" });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<EstadoAfip>("/config/facturacion/estado-afip");
      setEstado(data);
      if (data.cuit) setConfig(c => ({ ...c, cuit: data.cuit ?? "" }));
      if (data.punto_venta) setConfig(c => ({ ...c, punto_venta: data.punto_venta ?? 1 }));
      if (data.modo) setConfig(c => ({ ...c, modo: data.modo }));
    } catch {
      toast.error("Error al cargar configuración AFIP");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.cuit) {
      toast.error("El CUIT es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("cuit", config.cuit);
      formData.append("punto_venta", String(config.punto_venta));
      formData.append("modo", config.modo);
      if (certFile) formData.append("certificado", certFile);
      if (keyFile) formData.append("clave_privada", keyFile);

      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/config/facturacion/credenciales`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al guardar" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      toast.success("Configuración AFIP guardada");
      setCertFile(null);
      setKeyFile(null);
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar configuración AFIP");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConexion = async () => {
    setTestando(true);
    try {
      const result = await apiFetch<{ ok: boolean; mensaje: string }>("/config/facturacion/test-conexion", { method: "POST" });
      if (result.ok) {
        toast.success(result.mensaje ?? "Conexión con AFIP exitosa");
      } else {
        toast.error(result.mensaje ?? "Error en la conexión");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Error al testear conexión");
    } finally {
      setTestando(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <form onSubmit={handleGuardarConfig} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Facturación (AFIP / ARCA)</h2>
        <p className="text-sm text-gray-500 mt-1">Configuración para emisión de facturas electrónicas.</p>
      </div>

      {/* Estado */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${estado?.configurado ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
        {estado?.configurado ? (
          <>
            <Wifi className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">AFIP configurado</p>
              <p className="text-xs text-green-600">
                CUIT: {estado.cuit} · PV: {estado.punto_venta} · Modo: {estado.modo === "produccion" ? "Producción" : "Homologación"}
                {estado.cert_expiry && ` · Cert. vence: ${new Date(estado.cert_expiry).toLocaleDateString("es-AR")}`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestConexion}
              disabled={testando}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-300 bg-white rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors"
            >
              {testando ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              {testando ? "Testeando..." : "Test conexión"}
            </button>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-500">AFIP no configurado</p>
          </>
        )}
      </div>

      {/* Datos básicos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Datos del emisor</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>CUIT del estudio <span className="text-red-500">*</span></label>
            <input
              className={INPUT}
              value={config.cuit}
              onChange={e => setConfig(c => ({ ...c, cuit: e.target.value }))}
              placeholder="20-12345678-9"
              required
            />
          </div>
          <div>
            <label className={LABEL}>Punto de venta</label>
            <input
              className={INPUT}
              type="number"
              min={1}
              value={config.punto_venta}
              onChange={e => setConfig(c => ({ ...c, punto_venta: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div>
          <label className={LABEL}>Modo</label>
          <select
            className={INPUT}
            value={config.modo}
            onChange={e => setConfig(c => ({ ...c, modo: e.target.value }))}
          >
            <option value="homologacion">Homologación (pruebas)</option>
            <option value="produccion">Producción</option>
          </select>
          {config.modo === "produccion" && (
            <p className="text-xs text-amber-600 mt-1">
              En modo producción se emiten facturas reales ante AFIP.
            </p>
          )}
        </div>
      </div>

      {/* Certificados */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Certificados digitales</h3>
        <p className="text-xs text-gray-400">
          Subí el certificado (.crt / .pem) y la clave privada (.key) generados en el portal de AFIP.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Certificado (.crt / .pem)</label>
            <label className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 cursor-pointer hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">{certFile ? certFile.name : "Seleccionar archivo"}</span>
              <input
                type="file"
                accept=".crt,.pem,.cer"
                className="hidden"
                onChange={e => setCertFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {estado?.configurado && !certFile && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Certificado ya cargado
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>Clave privada (.key)</label>
            <label className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 cursor-pointer hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">{keyFile ? keyFile.name : "Seleccionar archivo"}</span>
              <input
                type="file"
                accept=".key,.pem"
                className="hidden"
                onChange={e => setKeyFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {estado?.configurado && !keyFile && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Clave ya cargada
              </p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Los archivos se almacenan de forma encriptada. No los compartás por email ni los subas a servicios externos.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}
