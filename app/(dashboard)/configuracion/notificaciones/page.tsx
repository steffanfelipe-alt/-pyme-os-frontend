"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface ConfigNotificaciones {
  alertas_vencimiento_activo: boolean;
  alertas_mora_activo: boolean;
  alertas_riesgo_activo: boolean;
  alertas_tareas_activo: boolean;
  alertas_documentacion_activo: boolean;
  dias_antes_vencimiento_alerta: number;
  umbral_mora_dias: number;
  umbral_riesgo_score: number;
  canal_email_activo: boolean;
  canal_telegram_activo: boolean;
  canal_portal_activo: boolean;
  firma_email: string;
  frecuencia_resumen: string;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
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

export default function NotificacionesPage() {
  const toast = useToast();
  const [form, setForm] = useState<ConfigNotificaciones>({
    alertas_vencimiento_activo: true,
    alertas_mora_activo: true,
    alertas_riesgo_activo: true,
    alertas_tareas_activo: true,
    alertas_documentacion_activo: true,
    dias_antes_vencimiento_alerta: 5,
    umbral_mora_dias: 10,
    umbral_riesgo_score: 70,
    canal_email_activo: true,
    canal_telegram_activo: false,
    canal_portal_activo: true,
    firma_email: "",
    frecuencia_resumen: "diario",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ConfigNotificaciones>("/config/notificaciones");
      setForm(prev => ({ ...prev, ...data }));
    } catch {
      toast.error("Error al cargar configuración de notificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/config/notificaciones", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Configuración de notificaciones guardada");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
        <p className="text-sm text-gray-500 mt-1">Configurá qué alertas se generan y cómo se envían.</p>
      </div>

      {/* Tipos de alertas activas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Tipos de alertas activas</h3>
        </div>
        <div className="space-y-0">
          <ToggleRow
            label="Alertas de vencimientos"
            description="Avisa cuando un vencimiento fiscal se acerca"
            checked={form.alertas_vencimiento_activo}
            onChange={v => setForm(f => ({ ...f, alertas_vencimiento_activo: v }))}
          />
          <ToggleRow
            label="Alertas de mora en cobranza"
            description="Avisa cuando un cliente tiene abonos impagos"
            checked={form.alertas_mora_activo}
            onChange={v => setForm(f => ({ ...f, alertas_mora_activo: v }))}
          />
          <ToggleRow
            label="Alertas de score de riesgo alto"
            description="Avisa cuando el score de riesgo de un cliente supera el umbral"
            checked={form.alertas_riesgo_activo}
            onChange={v => setForm(f => ({ ...f, alertas_riesgo_activo: v }))}
          />
          <ToggleRow
            label="Tareas vencidas"
            description="Avisa cuando hay tareas con fecha pasada sin completar"
            checked={form.alertas_tareas_activo}
            onChange={v => setForm(f => ({ ...f, alertas_tareas_activo: v }))}
          />
          <ToggleRow
            label="Documentación pendiente"
            description="Avisa cuando faltan documentos del cliente"
            checked={form.alertas_documentacion_activo}
            onChange={v => setForm(f => ({ ...f, alertas_documentacion_activo: v }))}
          />
        </div>
      </div>

      {/* Umbrales */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Umbrales de activación</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Días antes del vencimiento</label>
            <input
              className={INPUT}
              type="number"
              min={1}
              max={30}
              value={form.dias_antes_vencimiento_alerta}
              onChange={e => setForm(f => ({ ...f, dias_antes_vencimiento_alerta: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className={LABEL}>Días de mora para alerta</label>
            <input
              className={INPUT}
              type="number"
              min={1}
              max={90}
              value={form.umbral_mora_dias}
              onChange={e => setForm(f => ({ ...f, umbral_mora_dias: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className={LABEL}>Score de riesgo (0-100)</label>
            <input
              className={INPUT}
              type="number"
              min={0}
              max={100}
              value={form.umbral_riesgo_score}
              onChange={e => setForm(f => ({ ...f, umbral_riesgo_score: Number(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      {/* Canales de envío */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Canales de envío</h3>
        <div className="space-y-0">
          <ToggleRow
            label="Email"
            description="Enviar alertas por correo electrónico"
            checked={form.canal_email_activo}
            onChange={v => setForm(f => ({ ...f, canal_email_activo: v }))}
          />
          <ToggleRow
            label="Telegram"
            description="Enviar notificaciones al bot de Telegram del estudio"
            checked={form.canal_telegram_activo}
            onChange={v => setForm(f => ({ ...f, canal_telegram_activo: v }))}
          />
          <ToggleRow
            label="Portal del cliente"
            description="Mostrar notificaciones en el portal del cliente"
            checked={form.canal_portal_activo}
            onChange={v => setForm(f => ({ ...f, canal_portal_activo: v }))}
          />
        </div>
      </div>

      {/* Resumen y firma */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Resumen periódico y firma</h3>
        <div>
          <label className={LABEL}>Frecuencia de resumen por email</label>
          <select
            className={INPUT}
            value={form.frecuencia_resumen}
            onChange={e => setForm(f => ({ ...f, frecuencia_resumen: e.target.value }))}
          >
            <option value="desactivado">Desactivado</option>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Firma de email</label>
          <textarea
            className={INPUT}
            rows={3}
            value={form.firma_email}
            onChange={e => setForm(f => ({ ...f, firma_email: e.target.value }))}
            placeholder="Ej: Estudio Contable XYZ | Tel: 011-1234-5678 | www.miestudio.com"
          />
          <p className="text-xs text-gray-400 mt-1">Se agrega al pie de todos los emails enviados a clientes.</p>
        </div>
      </div>

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
