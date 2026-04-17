"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, CreditCard } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface ConfigCobranza {
  dia_generacion_abono: number;
  dias_gracia_mora: number;
  metodo_cobro_preferido: string;
  cbu_alias: string;
  banco_nombre: string;
  titular_cuenta: string;
  moneda_cobro: string;
  cobro_automatico_activo: boolean;
  recordatorio_dias_antes: number;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

export default function CobranzaPage() {
  const toast = useToast();
  const [form, setForm] = useState<ConfigCobranza>({
    dia_generacion_abono: 1,
    dias_gracia_mora: 5,
    metodo_cobro_preferido: "transferencia",
    cbu_alias: "",
    banco_nombre: "",
    titular_cuenta: "",
    moneda_cobro: "ARS",
    cobro_automatico_activo: false,
    recordatorio_dias_antes: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ConfigCobranza>("/config/cobranza");
      setForm(prev => ({ ...prev, ...data }));
    } catch {
      toast.error("Error al cargar configuración de cobranza");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/config/cobranza", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      toast.success("Configuración de cobranza guardada");
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
        <h2 className="text-xl font-bold text-gray-900">Abonos y cobranza</h2>
        <p className="text-sm text-gray-500 mt-1">Configuración de generación de abonos, plazos y datos bancarios.</p>
      </div>

      {/* Tiempos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Plazos y ciclos</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Día de generación de abonos</label>
            <input
              className={INPUT}
              type="number"
              min={1}
              max={28}
              value={form.dia_generacion_abono}
              onChange={e => setForm(f => ({ ...f, dia_generacion_abono: Number(e.target.value) }))}
            />
            <p className="text-xs text-gray-400 mt-1">Día del mes en que se generan los abonos</p>
          </div>
          <div>
            <label className={LABEL}>Días de gracia antes de mora</label>
            <input
              className={INPUT}
              type="number"
              min={0}
              max={30}
              value={form.dias_gracia_mora}
              onChange={e => setForm(f => ({ ...f, dias_gracia_mora: Number(e.target.value) }))}
            />
            <p className="text-xs text-gray-400 mt-1">Días después del vencimiento para considerar mora</p>
          </div>
          <div>
            <label className={LABEL}>Recordatorio (días antes del vencimiento)</label>
            <input
              className={INPUT}
              type="number"
              min={0}
              max={30}
              value={form.recordatorio_dias_antes}
              onChange={e => setForm(f => ({ ...f, recordatorio_dias_antes: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className={LABEL}>Moneda de cobro</label>
            <select
              className={INPUT}
              value={form.moneda_cobro}
              onChange={e => setForm(f => ({ ...f, moneda_cobro: e.target.value }))}
            >
              <option value="ARS">ARS — Peso argentino</option>
              <option value="USD">USD — Dólar estadounidense</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={form.cobro_automatico_activo}
            onChange={e => setForm(f => ({ ...f, cobro_automatico_activo: e.target.checked }))}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Activar generación automática de abonos mensuales</span>
        </label>
      </div>

      {/* Datos bancarios */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Datos bancarios para cobro</h3>
        <div>
          <label className={LABEL}>Método de cobro preferido</label>
          <select
            className={INPUT}
            value={form.metodo_cobro_preferido}
            onChange={e => setForm(f => ({ ...f, metodo_cobro_preferido: e.target.value }))}
          >
            <option value="transferencia">Transferencia bancaria</option>
            <option value="efectivo">Efectivo</option>
            <option value="cheque">Cheque</option>
            <option value="mercadopago">MercadoPago</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={LABEL}>CBU / Alias</label>
            <input
              className={INPUT}
              value={form.cbu_alias}
              onChange={e => setForm(f => ({ ...f, cbu_alias: e.target.value }))}
              placeholder="0000000000000000000000 o mi.alias"
            />
          </div>
          <div>
            <label className={LABEL}>Banco</label>
            <input
              className={INPUT}
              value={form.banco_nombre}
              onChange={e => setForm(f => ({ ...f, banco_nombre: e.target.value }))}
              placeholder="Banco Nación, Galicia, etc."
            />
          </div>
          <div>
            <label className={LABEL}>Titular de la cuenta</label>
            <input
              className={INPUT}
              value={form.titular_cuenta}
              onChange={e => setForm(f => ({ ...f, titular_cuenta: e.target.value }))}
              placeholder="Nombre del titular"
            />
          </div>
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
