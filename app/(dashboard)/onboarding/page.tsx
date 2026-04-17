"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Upload,
  Loader2, Check, Rocket, ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PasoEstado {
  numero: number;
  titulo: string;
  completado: boolean;
}

interface EstadoOnboarding {
  paso_actual: number;
  completado: boolean;
  porcentaje: number;
  pasos: PasoEstado[];
}

interface Sugerencia {
  id: number;
  tipo_obligacion: string;
  periodo: string;
  fecha_vencimiento_estimada: string;
  fecha_es_estimada: boolean;
  nota_verificacion: string | null;
  estado: string;
}

interface ClienteSugerido {
  cliente_id: number;
  cliente_nombre: string;
  categoria_fiscal: string;
  sugerencias: Sugerencia[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

const PASOS = [
  { numero: 1, label: "Estudio", descripcion: "Datos del estudio contable" },
  { numero: 2, label: "Equipo", descripcion: "Miembros del equipo" },
  { numero: 3, label: "Clientes", descripcion: "Importar clientes" },
  { numero: 4, label: "Vencimientos", descripcion: "Vencimientos sugeridos" },
  { numero: 5, label: "Notificaciones", descripcion: "Canales de alerta" },
];

// ─── Barra de progreso ────────────────────────────────────────────────────────

function BarraProgreso({ pasoActual, completados }: { pasoActual: number; completados: Set<number> }) {
  return (
    <div className="flex items-center gap-0">
      {PASOS.map((paso, idx) => {
        const estaCompletado = completados.has(paso.numero);
        const esActual = pasoActual === paso.numero;
        return (
          <div key={paso.numero} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 ${idx < PASOS.length - 1 ? "mr-0" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                estaCompletado ? "bg-green-500 text-white" :
                esActual ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                "bg-gray-200 text-gray-500"
              }`}>
                {estaCompletado ? <Check className="w-4 h-4" /> : paso.numero}
              </div>
              <span className={`text-xs font-medium ${esActual ? "text-blue-600" : estaCompletado ? "text-green-600" : "text-gray-400"}`}>
                {paso.label}
              </span>
            </div>
            {idx < PASOS.length - 1 && (
              <div className={`h-0.5 w-12 mx-1 mb-5 ${estaCompletado ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Pantalla de finalización ─────────────────────────────────────────────────

function PantallaCompletado({ onIrDashboard }: { onIrDashboard: () => void }) {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">¡Configuración completa!</h3>
        <p className="text-sm text-gray-500 mt-1">
          Tu estudio está listo para operar. Podés volver a esta pantalla cuando quieras.
        </p>
      </div>
      <button
        onClick={onIrDashboard}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mx-auto"
      >
        Ir al Dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Paso 1: Datos del estudio ────────────────────────────────────────────────

function Paso1Estudio({ onNext }: { onNext: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    nombre: "", cuit: "", razon_social: "", condicion_iva: "responsable_inscripto",
    direccion_fiscal: "", telefono_contacto: "", email_contacto: "",
    nombre_responsable: "", provincia_principal: "Buenos Aires",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<Record<string, unknown>>("/config/perfil").then(data => {
      setForm(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, v === null ? (typeof prev[k as keyof typeof prev] === "number" ? 0 : "") : v])
        ),
      }));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre) { toast.error("El nombre del estudio es obligatorio"); return; }
    setSaving(true);
    try {
      await apiFetch("/config/perfil", { method: "PATCH", body: JSON.stringify(form) });
      await apiFetch("/onboarding/completar-paso", {
        method: "POST",
        body: JSON.stringify({ paso: "estudio_configurado" }),
      });
      onNext();
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Nombre del estudio <span className="text-red-500">*</span></label>
          <input className={INPUT} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
        </div>
        <div>
          <label className={LABEL}>CUIT</label>
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
          <label className={LABEL}>Email de contacto</label>
          <input className={INPUT} type="email" value={form.email_contacto} onChange={e => setForm(f => ({ ...f, email_contacto: e.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Guardando..." : "Continuar"}
          {!saving && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}

// ─── Paso 2: Equipo ───────────────────────────────────────────────────────────

function Paso2Equipo({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const toast = useToast();
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [form, setForm] = useState({ nombre: "", email: "", rol: "contador", password: "" });
  const [saving, setSaving] = useState(false);
  const [completando, setCompletando] = useState(false);

  useEffect(() => {
    apiFetch<any[]>("/api/empleados").then(setEmpleados).catch(() => {});
  }, []);

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) { toast.error("Completá todos los campos"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/empleados", { method: "POST", body: JSON.stringify(form) });
      const lista = await apiFetch<any[]>("/api/empleados");
      setEmpleados(lista);
      setForm({ nombre: "", email: "", rol: "contador", password: "" });
      toast.success("Miembro agregado");
    } catch (e: any) {
      toast.error(e.message ?? "Error al agregar");
    } finally {
      setSaving(false);
    }
  };

  const handleContinuar = async () => {
    setCompletando(true);
    try {
      await apiFetch("/onboarding/completar-paso", { method: "POST", body: JSON.stringify({ paso: "equipo_configurado" }) });
      onNext();
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setCompletando(false);
    }
  };

  const ROL_OPTS = [
    { value: "contador", label: "Contador" },
    { value: "administrativo", label: "Administrativo" },
    { value: "solo_lectura", label: "Solo lectura" },
  ];

  return (
    <div className="space-y-5">
      {empleados.length > 0 && (
        <div className="space-y-2">
          {empleados.map(e => (
            <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">{e.nombre}</p>
                <p className="text-xs text-gray-400">{e.email} · {e.rol}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAgregar} className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
        <p className="text-sm font-medium text-gray-700">Agregar miembro</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Nombre</label>
            <input className={INPUT} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Email</label>
            <input className={INPUT} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Rol</label>
            <select className={INPUT} value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
              {ROL_OPTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Contraseña</label>
            <input className={INPUT} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} autoComplete="new-password" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {saving ? "Agregando..." : "Agregar miembro"}
        </button>
      </form>
      <div className="flex justify-between pt-2">
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline">
          Saltar por ahora
        </button>
        <button onClick={handleContinuar} disabled={completando} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {completando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─── Paso 3: Clientes ─────────────────────────────────────────────────────────

function Paso3Clientes({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState<{ importados: number; errores: number } | null>(null);
  const [completando, setCompletando] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true);
    setResultado(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const formData = new FormData();
      formData.append("file", file);
      const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${BASE}/onboarding/importar-clientes`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al importar" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResultado({ importados: data.importados ?? 0, errores: (data.errores ?? []).length });
      toast.success(`${data.importados} clientes importados`);
    } catch (e: any) {
      toast.error(e.message ?? "Error al importar");
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleContinuar = async () => {
    setCompletando(true);
    try {
      await apiFetch("/onboarding/completar-paso", { method: "POST", body: JSON.stringify({ paso: "clientes_importados" }) });
      onNext();
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setCompletando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm font-medium text-blue-800 mb-1">Formato del CSV</p>
        <p className="text-xs text-blue-600">
          Columnas requeridas: <code className="bg-blue-100 px-1 rounded">nombre</code>, <code className="bg-blue-100 px-1 rounded">cuit</code>
          <br />
          Opcionales: <code className="bg-blue-100 px-1 rounded">categoria_fiscal</code>, <code className="bg-blue-100 px-1 rounded">email</code>, <code className="bg-blue-100 px-1 rounded">telefono</code>
        </p>
      </div>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={importando}
        className="w-full flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-all"
      >
        {importando ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Importando clientes...</>
        ) : (
          <><Upload className="w-5 h-5" /> Seleccionar archivo CSV</>
        )}
      </button>

      {resultado && (
        <div className={`p-3 rounded-lg border ${resultado.errores === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${resultado.errores === 0 ? "text-green-600" : "text-amber-600"}`} />
            <p className={`text-sm font-medium ${resultado.errores === 0 ? "text-green-800" : "text-amber-800"}`}>
              {resultado.importados} clientes importados
              {resultado.errores > 0 && ` · ${resultado.errores} con errores`}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline">
          Saltar por ahora
        </button>
        <button onClick={handleContinuar} disabled={completando} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {completando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          Continuar
        </button>
      </div>
    </div>
  );
}

// ─── Paso 4: Vencimientos sugeridos ──────────────────────────────────────────

function Paso4Vencimientos({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const toast = useToast();
  const [grupos, setGrupos] = useState<ClienteSugerido[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    apiFetch<ClienteSugerido[]>("/onboarding/vencimientos-sugeridos")
      .then(data => {
        setGrupos(data);
        // Pre-seleccionar todos los pendientes
        const ids = new Set<number>();
        for (const g of data) {
          for (const s of g.sugerencias) {
            if (s.estado === "pendiente_confirmacion") ids.add(s.id);
          }
        }
        setSeleccionados(ids);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSeleccion = (id: number) => {
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSugerencias = grupos.reduce((acc, g) => acc + g.sugerencias.length, 0);

  const handleConfirmar = async () => {
    setConfirmando(true);
    try {
      if (seleccionados.size > 0) {
        await apiFetch("/onboarding/vencimientos-sugeridos/confirmar", {
          method: "POST",
          body: JSON.stringify(Array.from(seleccionados)),
        });
      }
      await apiFetch("/onboarding/completar-paso", { method: "POST", body: JSON.stringify({ paso: "vencimientos_configurados" }) });
      onNext();
    } catch (e: any) {
      toast.error(e.message ?? "Error al confirmar");
    } finally {
      setConfirmando(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}</div>;

  if (grupos.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No hay vencimientos sugeridos aún. Podés cargarlos manualmente desde la sección Vencimientos.</p>
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline">Saltar</button>
          <button onClick={handleConfirmar} disabled={confirmando} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <ChevronRight className="w-4 h-4" /> Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Seleccioná los vencimientos que querés confirmar. Los no seleccionados serán descartados.
        <span className="ml-2 font-medium text-blue-600">{seleccionados.size} de {totalSugerencias} seleccionados</span>
      </p>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {grupos.map(grupo => (
          <div key={grupo.cliente_id} className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">{grupo.cliente_nombre}</p>
              <p className="text-xs text-gray-400 capitalize">{grupo.categoria_fiscal.replace(/_/g, " ")}</p>
            </div>
            <div className="divide-y divide-gray-100">
              {grupo.sugerencias.map(s => (
                <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${seleccionados.has(s.id) ? "bg-blue-50" : "bg-white hover:bg-gray-50"}`}>
                  <input
                    type="checkbox"
                    checked={seleccionados.has(s.id)}
                    onChange={() => toggleSeleccion(s.id)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{s.tipo_obligacion}</p>
                    <p className="text-xs text-gray-500">
                      {s.periodo} · {new Date(s.fecha_vencimiento_estimada + "T00:00:00").toLocaleDateString("es-AR")}
                      {s.fecha_es_estimada && <span className="ml-1 text-amber-500">(estimada)</span>}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <button onClick={onSkip} className="text-sm text-gray-400 hover:text-gray-600 underline">Saltar</button>
        <button onClick={handleConfirmar} disabled={confirmando} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {confirmando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {confirmando ? "Confirmando..." : `Confirmar ${seleccionados.size} vencimientos`}
        </button>
      </div>
    </div>
  );
}

// ─── Paso 5: Notificaciones ───────────────────────────────────────────────────

function Paso5Notificaciones({ onFinish }: { onFinish: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    canal_email_activo: true,
    canal_telegram_activo: false,
    canal_portal_activo: true,
    dias_antes_vencimiento_alerta: 5,
    firma_email: "",
  });
  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await apiFetch("/config/notificaciones", { method: "PATCH", body: JSON.stringify(form) });
      await apiFetch("/onboarding/completar-paso", { method: "POST", body: JSON.stringify({ paso: "notificaciones_configuradas" }) });
      onFinish();
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Canales de notificación</p>
        {[
          { key: "canal_email_activo", label: "Email", desc: "Recibir alertas y notificaciones por correo electrónico" },
          { key: "canal_telegram_activo", label: "Telegram", desc: "Notificaciones al bot de Telegram (configurar en Integraciones)" },
          { key: "canal_portal_activo", label: "Portal del cliente", desc: "Notificaciones visibles en el portal del cliente" },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={form[key as keyof typeof form] as boolean}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </label>
        ))}
      </div>
      <div>
        <label className={LABEL}>Días antes del vencimiento para alertar</label>
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
        <label className={LABEL}>Firma de email (opcional)</label>
        <textarea
          className={INPUT}
          rows={2}
          value={form.firma_email}
          onChange={e => setForm(f => ({ ...f, firma_email: e.target.value }))}
          placeholder="Estudio Contable XYZ | Tel: 011-1234-5678"
        />
      </div>
      <div className="flex justify-end pt-2">
        <button
          onClick={handleGuardar}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? "Finalizando..." : "Finalizar onboarding"}
        </button>
      </div>
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [completados, setCompletados] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [terminado, setTerminado] = useState(false);

  const cargarEstado = useCallback(async () => {
    try {
      const estado = await apiFetch<EstadoOnboarding>("/onboarding/estado");

      if (estado.completado) {
        setTerminado(true);
        setCompletados(new Set([1, 2, 3, 4, 5]));
        setLoading(false);
        return;
      }

      const nuevosCompletados = new Set<number>();
      for (const p of estado.pasos) {
        if (p.completado) nuevosCompletados.add(p.numero);
      }
      setCompletados(nuevosCompletados);

      // Ir al primer paso incompleto
      let primerIncompleto = 1;
      for (let i = 1; i <= 5; i++) {
        if (!nuevosCompletados.has(i)) {
          primerIncompleto = i;
          break;
        }
      }
      setPaso(primerIncompleto);
    } catch {
      // Si el backend no responde, mostrar paso 1
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  const marcarCompletado = (num: number) => {
    setCompletados(prev => new Set([...prev, num]));
  };

  const irSiguientePaso = (num: number) => {
    marcarCompletado(num);
    setPaso(num + 1);
  };

  const saltarPaso = (num: number) => {
    setPaso(num + 1);
  };

  const handleFinish = () => {
    marcarCompletado(5);
    setTerminado(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const pasoInfo = PASOS[Math.min(paso, 5) - 1];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-900 leading-none">PyME OS</p>
            <p className="text-xs text-gray-400 mt-0.5">Configuración inicial</p>
          </div>
        </div>

        {/* Barra de progreso */}
        {!terminado && (
          <div className="flex justify-center mb-8">
            <BarraProgreso pasoActual={paso} completados={completados} />
          </div>
        )}

        {/* Card del paso */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {terminado ? (
            <PantallaCompletado onIrDashboard={() => router.push("/")} />
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  Paso {paso}: {pasoInfo.descripcion}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {paso === 1 && "Completá los datos básicos del estudio contable."}
                  {paso === 2 && "Invitá a los miembros de tu equipo al sistema."}
                  {paso === 3 && "Importá tu cartera de clientes desde un archivo CSV."}
                  {paso === 4 && "Revisá y confirmá los vencimientos sugeridos por el sistema."}
                  {paso === 5 && "Configurá cómo querés recibir alertas y notificaciones."}
                </p>
              </div>

              {paso === 1 && <Paso1Estudio onNext={() => irSiguientePaso(1)} />}
              {paso === 2 && <Paso2Equipo onNext={() => irSiguientePaso(2)} onSkip={() => saltarPaso(2)} />}
              {paso === 3 && <Paso3Clientes onNext={() => irSiguientePaso(3)} onSkip={() => saltarPaso(3)} />}
              {paso === 4 && <Paso4Vencimientos onNext={() => irSiguientePaso(4)} onSkip={() => saltarPaso(4)} />}
              {paso === 5 && <Paso5Notificaciones onFinish={handleFinish} />}
            </>
          )}
        </div>

        {/* Navegación inferior */}
        {!terminado && paso > 1 && (
          <div className="flex justify-start mt-4">
            <button
              onClick={() => setPaso(p => p - 1)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Paso anterior
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
