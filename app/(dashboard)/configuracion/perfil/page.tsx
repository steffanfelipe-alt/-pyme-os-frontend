"use client";

import { useState, useEffect } from "react";
import { Save, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Perfil {
  nombre: string;
  cuit: string;
  razon_social: string;
  condicion_iva: string;
  direccion_fiscal: string;
  telefono_contacto: string;
  email_contacto: string;
  nombre_responsable: string;
  logo_url?: string;
  provincia_principal: string;
  tarifa_horaria_interna: number;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

export default function PerfilPage() {
  const [form, setForm] = useState<Perfil>({
    nombre: "", cuit: "", razon_social: "", condicion_iva: "responsable_inscripto",
    direccion_fiscal: "", telefono_contacto: "", email_contacto: "",
    nombre_responsable: "", provincia_principal: "Buenos Aires", tarifa_horaria_interna: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    apiFetch<Perfil>("/config/perfil").then(data => {
      setForm(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === null ? (typeof prev[k as keyof Perfil] === "number" ? 0 : "") : v])
        ),
      }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setOk(false);
    try {
      await apiFetch("/config/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Perfil del estudio</h2>
        <p className="text-sm text-gray-500 mt-1">Datos que aparecen en emails, portal del cliente y reportes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={LABEL}>Nombre del estudio <span className="text-red-500">*</span></label>
            <input className={INPUT} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          </div>
          <div>
            <label className={LABEL}>CUIT del estudio <span className="text-red-500">*</span></label>
            <input className={INPUT} value={form.cuit} onChange={e => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="20-12345678-9" />
          </div>
          <div>
            <label className={LABEL}>Razón social</label>
            <input className={INPUT} value={form.razon_social} onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Condición IVA</label>
            <select className={INPUT} value={form.condicion_iva} onChange={e => setForm(f => ({ ...f, condicion_iva: e.target.value }))}>
              <option value="responsable_inscripto">Responsable Inscripto</option>
              <option value="monotributista">Monotributista</option>
              <option value="exento">Exento</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Nombre del responsable</label>
            <input className={INPUT} value={form.nombre_responsable} onChange={e => setForm(f => ({ ...f, nombre_responsable: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>Dirección fiscal</label>
            <input className={INPUT} value={form.direccion_fiscal} onChange={e => setForm(f => ({ ...f, direccion_fiscal: e.target.value }))} placeholder="Av. Corrientes 1234, CABA" />
          </div>
          <div>
            <label className={LABEL}>Teléfono de contacto</label>
            <input className={INPUT} value={form.telefono_contacto} onChange={e => setForm(f => ({ ...f, telefono_contacto: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Email de contacto público</label>
            <input className={INPUT} type="email" value={form.email_contacto} onChange={e => setForm(f => ({ ...f, email_contacto: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Provincia principal</label>
            <input className={INPUT} value={form.provincia_principal} onChange={e => setForm(f => ({ ...f, provincia_principal: e.target.value }))} placeholder="Buenos Aires" />
          </div>
          <div>
            <label className={LABEL}>Tarifa horaria interna ($/hora) <span className="text-red-500">*</span></label>
            <input
              className={INPUT}
              type="number"
              min={0}
              value={form.tarifa_horaria_interna}
              onChange={e => setForm(f => ({ ...f, tarifa_horaria_interna: Number(e.target.value) }))}
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
        {ok && <span className="text-sm text-green-600 font-medium">✓ Guardado correctamente</span>}
      </div>
    </form>
  );
}
