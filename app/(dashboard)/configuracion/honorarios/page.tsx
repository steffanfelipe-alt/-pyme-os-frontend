"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Save, AlertTriangle, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface ConfigHonorarios {
  honorario_base_monotributo: number;
  honorario_base_responsable: number;
  honorario_base_sociedad: number;
  honorario_base_empleador: number;
  ajuste_inflacion_activo: boolean;
  ajuste_inflacion_porcentaje: number;
}

interface ImpactoHonorarios {
  clientes_afectados: number;
  clientes_con_honorario_personalizado: number;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

const CATEGORIAS = [
  { key: "honorario_base_monotributo", label: "Monotributista" },
  { key: "honorario_base_responsable", label: "Responsable Inscripto" },
  { key: "honorario_base_sociedad", label: "Sociedad / SRL / SA" },
  { key: "honorario_base_empleador", label: "Con empleados (adicional)" },
] as const;

export default function HonorariosPage() {
  const toast = useToast();
  const [form, setForm] = useState<ConfigHonorarios>({
    honorario_base_monotributo: 0,
    honorario_base_responsable: 0,
    honorario_base_sociedad: 0,
    honorario_base_empleador: 0,
    ajuste_inflacion_activo: false,
    ajuste_inflacion_porcentaje: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [impacto, setImpacto] = useState<ImpactoHonorarios | null>(null);
  const [loadingImpacto, setLoadingImpacto] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ConfigHonorarios>("/config/honorarios");
      setForm(data);
    } catch {
      toast.error("Error al cargar configuración de honorarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const consultarImpacto = async () => {
    setLoadingImpacto(true);
    try {
      const data = await apiFetch<ImpactoHonorarios>("/config/honorarios/impacto");
      setImpacto(data);
      setConfirmando(true);
    } catch {
      toast.error("Error al consultar impacto");
    } finally {
      setLoadingImpacto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setConfirmando(false);
    try {
      await apiFetch("/config/honorarios", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Honorarios actualizados correctamente");
      setImpacto(null);
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Honorarios y tarifas</h2>
        <p className="text-sm text-gray-500 mt-1">
          Honorario base mensual por categoría fiscal. Al guardar, se actualiza automáticamente a los clientes sin honorario personalizado.
        </p>
      </div>

      {/* Honorarios por categoría */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Honorario base por categoría</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIAS.map(({ key, label }) => (
            <div key={key}>
              <label className={LABEL}>{label} ($/mes)</label>
              <input
                className={INPUT}
                type="number"
                min={0}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ajuste por inflación */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Actualización por inflación</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.ajuste_inflacion_activo}
            onChange={e => setForm(f => ({ ...f, ajuste_inflacion_activo: e.target.checked }))}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Activar ajuste automático mensual por inflación</span>
        </label>
        {form.ajuste_inflacion_activo && (
          <div>
            <label className={LABEL}>Porcentaje de ajuste mensual (%)</label>
            <input
              className={INPUT}
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.ajuste_inflacion_porcentaje}
              onChange={e => setForm(f => ({ ...f, ajuste_inflacion_porcentaje: Number(e.target.value) }))}
            />
            <p className="text-xs text-gray-400 mt-1">
              Ej: 5 = 5% mensual. Se aplicará a todos los honorarios base el 1° de cada mes.
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Los clientes con honorario personalizado no serán modificados. Solo se actualizan los que usan el honorario base de su categoría.
        </p>
      </div>

      {/* Confirmación de impacto */}
      {confirmando && impacto && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Esto actualizará el honorario de {impacto.clientes_afectados} cliente{impacto.clientes_afectados !== 1 ? "s" : ""}.
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {impacto.clientes_con_honorario_personalizado} cliente{impacto.clientes_con_honorario_personalizado !== 1 ? "s" : ""} con honorario personalizado no se modifica{impacto.clientes_con_honorario_personalizado !== 1 ? "n" : ""}.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Guardando..." : "Confirmar y guardar"}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {!confirmando && (
        <div className="flex items-center gap-3">
          <button
            onClick={consultarImpacto}
            disabled={loadingImpacto || saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {loadingImpacto ? "Calculando impacto..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
