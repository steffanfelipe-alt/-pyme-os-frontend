"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Globe, Users, ExternalLink, Copy } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface ConfigPortal {
  portal_activo: boolean;
  portal_url_personalizada: string;
  portal_nombre: string;
  portal_mensaje_bienvenida: string;
  portal_permite_subir_docs: boolean;
  portal_permite_ver_cobros: boolean;
  portal_permite_ver_vencimientos: boolean;
}

interface ClientePortal {
  id: number;
  nombre: string;
  portal_usuario_email: string | null;
  portal_activo: boolean;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-3 border-b border-gray-50 last:border-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
      />
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

export default function PortalPage() {
  const toast = useToast();
  const [form, setForm] = useState<ConfigPortal>({
    portal_activo: false,
    portal_url_personalizada: "",
    portal_nombre: "",
    portal_mensaje_bienvenida: "",
    portal_permite_subir_docs: true,
    portal_permite_ver_cobros: true,
    portal_permite_ver_vencimientos: true,
  });
  const [clientes, setClientes] = useState<ClientePortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [configData, clientesData] = await Promise.all([
        apiFetch<ConfigPortal>("/config/perfil"),
        apiFetch<ClientePortal[]>("/api/clientes?limit=200").catch(() => []),
      ]);
      setForm(prev => ({ ...prev, ...configData }));
      setClientes(Array.isArray(clientesData) ? clientesData : []);
    } catch {
      toast.error("Error al cargar configuración del portal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/config/perfil", {
        method: "PATCH",
        body: JSON.stringify({
          portal_activo: form.portal_activo,
          portal_nombre: form.portal_nombre,
          portal_mensaje_bienvenida: form.portal_mensaje_bienvenida,
          portal_permite_subir_docs: form.portal_permite_subir_docs,
          portal_permite_ver_cobros: form.portal_permite_ver_cobros,
          portal_permite_ver_vencimientos: form.portal_permite_ver_vencimientos,
        }),
      });
      toast.success("Configuración del portal guardada");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const portalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/portal`
    : "/portal";

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Portal del cliente</h2>
        <p className="text-sm text-gray-500 mt-1">
          El portal permite a tus clientes ver sus vencimientos, documentos y abonos sin intervención del estudio.
        </p>
      </div>

      {/* Estado del portal */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Estado del portal</h3>
        </div>
        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={form.portal_activo}
            onChange={e => setForm(f => ({ ...f, portal_activo: e.target.checked }))}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">Portal activo</p>
            <p className="text-xs text-gray-400 mt-0.5">Los clientes con acceso pueden ingresar al portal</p>
          </div>
          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${form.portal_activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {form.portal_activo ? "Activo" : "Inactivo"}
          </span>
        </label>

        {form.portal_activo && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Globe className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs text-blue-700 font-mono flex-1 truncate">{portalUrl}</span>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success("URL copiada"); }}
              className="p-1 rounded hover:bg-blue-100 transition-colors"
              title="Copiar URL"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
            </button>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-blue-100 transition-colors">
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </a>
          </div>
        )}
      </div>

      {/* Personalización */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Personalización</h3>
        <div>
          <label className={LABEL}>Nombre del portal</label>
          <input
            className={INPUT}
            value={form.portal_nombre}
            onChange={e => setForm(f => ({ ...f, portal_nombre: e.target.value }))}
            placeholder="Ej: Portal Estudio XYZ"
          />
        </div>
        <div>
          <label className={LABEL}>Mensaje de bienvenida</label>
          <textarea
            className={INPUT}
            rows={3}
            value={form.portal_mensaje_bienvenida}
            onChange={e => setForm(f => ({ ...f, portal_mensaje_bienvenida: e.target.value }))}
            placeholder="Bienvenido/a a tu portal. Acá podés ver tus vencimientos, documentos y pagos."
          />
        </div>
      </div>

      {/* Permisos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Funciones habilitadas</h3>
        <div className="space-y-0">
          <ToggleRow
            label="Ver vencimientos fiscales"
            description="El cliente puede ver sus próximos vencimientos"
            checked={form.portal_permite_ver_vencimientos}
            onChange={v => setForm(f => ({ ...f, portal_permite_ver_vencimientos: v }))}
          />
          <ToggleRow
            label="Ver historial de cobros"
            description="El cliente puede ver el estado de sus abonos"
            checked={form.portal_permite_ver_cobros}
            onChange={v => setForm(f => ({ ...f, portal_permite_ver_cobros: v }))}
          />
          <ToggleRow
            label="Subir documentos"
            description="El cliente puede subir comprobantes y documentación"
            checked={form.portal_permite_subir_docs}
            onChange={v => setForm(f => ({ ...f, portal_permite_subir_docs: v }))}
          />
        </div>
      </div>

      {/* Clientes con acceso */}
      {clientes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Clientes con acceso al portal</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {clientes.filter(c => c.portal_usuario_email).map(cliente => (
              <div key={cliente.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{cliente.nombre}</p>
                  <p className="text-xs text-gray-400">{cliente.portal_usuario_email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cliente.portal_activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {cliente.portal_activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            ))}
            {clientes.filter(c => c.portal_usuario_email).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                Ningún cliente tiene acceso al portal aún. Podés asignarlo desde la ficha del cliente.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
