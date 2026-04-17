"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Calendar, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface ConfigCalendario {
  iibb_provincia: string;
  iibb_dia_vencimiento: number | null;
  bienes_personales_activo: boolean;
  bienes_personales_categoria: string;
  ganancias_activo: boolean;
  retenciones_activo: boolean;
  f931_activo: boolean;
}

interface ProvinciaIIBB {
  nombre: string;
  dia_vencimiento: number;
  regimen: string;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
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

export default function CalendarioPage() {
  const toast = useToast();
  const [form, setForm] = useState<ConfigCalendario>({
    iibb_provincia: "Buenos Aires",
    iibb_dia_vencimiento: null,
    bienes_personales_activo: true,
    bienes_personales_categoria: "general",
    ganancias_activo: true,
    retenciones_activo: true,
    f931_activo: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provincias, setProvincias] = useState<Record<string, ProvinciaIIBB>>({});

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [data, provArr] = await Promise.all([
        apiFetch<ConfigCalendario>("/config/calendario-fiscal"),
        apiFetch<Array<{ provincia: string; dia_vencimiento: number }>>("/config/calendario-fiscal/provincias"),
      ]);
      setForm(prev => ({ ...prev, ...data }));
      const record = Object.fromEntries(
        provArr.map(p => [p.provincia, { nombre: p.provincia, dia_vencimiento: p.dia_vencimiento, regimen: "general" }])
      );
      setProvincias(record);
    } catch {
      toast.error("Error al cargar configuración del calendario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/config/calendario-fiscal", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Calendario fiscal guardado");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const provinciaSeleccionada = provincias[form.iibb_provincia];

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Calendario fiscal</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configuración de fechas y obligaciones fiscales para el seguimiento de vencimientos.
        </p>
      </div>

      {/* IIBB */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Ingresos Brutos (IIBB)</h3>
        </div>
        <div>
          <label className={LABEL}>Provincia principal</label>
          <select
            className={INPUT}
            value={form.iibb_provincia}
            onChange={e => setForm(f => ({ ...f, iibb_provincia: e.target.value }))}
          >
            {Object.keys(provincias).length > 0 ? (
              Object.keys(provincias).map(nombre => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))
            ) : (
              <option value={form.iibb_provincia}>{form.iibb_provincia}</option>
            )}
          </select>
          {provinciaSeleccionada && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">
                <span className="font-medium">{provinciaSeleccionada.regimen}</span> · Vence el día{" "}
                <span className="font-medium">{provinciaSeleccionada.dia_vencimiento}</span> de cada mes
              </p>
            </div>
          )}
        </div>
        {form.iibb_dia_vencimiento && (
          <div>
            <label className={LABEL}>Día de vencimiento IIBB (personalizado)</label>
            <input
              className={INPUT}
              type="number"
              min={1}
              max={31}
              value={form.iibb_dia_vencimiento}
              onChange={e => setForm(f => ({ ...f, iibb_dia_vencimiento: Number(e.target.value) }))}
            />
          </div>
        )}
      </div>

      {/* Obligaciones activas */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Obligaciones a seguir</h3>
        </div>
        <div className="space-y-0">
          <ToggleRow
            label="Bienes Personales"
            description="Seguimiento de vencimientos de Bienes Personales"
            checked={form.bienes_personales_activo}
            onChange={v => setForm(f => ({ ...f, bienes_personales_activo: v }))}
          />
          <ToggleRow
            label="Ganancias"
            description="Anticipos y presentación anual de Ganancias"
            checked={form.ganancias_activo}
            onChange={v => setForm(f => ({ ...f, ganancias_activo: v }))}
          />
          <ToggleRow
            label="Retenciones / Percepciones"
            description="Retenciones de IVA, Ganancias e IIBB"
            checked={form.retenciones_activo}
            onChange={v => setForm(f => ({ ...f, retenciones_activo: v }))}
          />
          <ToggleRow
            label="F931 (Empleadores)"
            description="Formulario mensual de cargas sociales"
            checked={form.f931_activo}
            onChange={v => setForm(f => ({ ...f, f931_activo: v }))}
          />
        </div>
      </div>

      {/* Bienes Personales - categoría */}
      {form.bienes_personales_activo && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Bienes Personales</h3>
          <div>
            <label className={LABEL}>Categoría por defecto</label>
            <select
              className={INPUT}
              value={form.bienes_personales_categoria}
              onChange={e => setForm(f => ({ ...f, bienes_personales_categoria: e.target.value }))}
            >
              <option value="general">General</option>
              <option value="ingreso_bajo">Ingreso bajo (exento)</option>
              <option value="responsable_sustituto">Responsable sustituto</option>
            </select>
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
