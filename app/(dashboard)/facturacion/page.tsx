"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Plus, Send, CreditCard, Settings, Loader2,
  CheckCircle2, XCircle, RefreshCw, X, ChevronDown,
} from "lucide-react";
import { facturacionApi, clientesApi, type Comprobante, type HonorarioRecurrente } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatFecha, formatCurrency, cn } from "@/lib/utils";

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  enviada: "bg-blue-100 text-blue-700",
  pagada: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

// Valores que acepta el backend: A, B o C (tipo_comprobante String(1))
const TIPOS_COMPROBANTE: { value: string; label: string }[] = [
  { value: "A", label: "Factura A (RI a RI)" },
  { value: "B", label: "Factura B (RI a consumidor final / monotributista)" },
  { value: "C", label: "Factura C (monotributista)" },
];

interface NuevoComprobanteForm {
  cliente_id: string;
  tipo_comprobante: string;
  descripcion_concepto: string;
  importe_neto: string;
  alicuota_iva: string;
  fecha_emision: string;
}

interface NuevoHonorarioForm {
  cliente_id: string;
  descripcion: string;
  importe_neto: string;
  alicuota_iva: string;
  tipo_comprobante: string;
  dia_emision: string;
}

const FORM_COMP_INICIAL: NuevoComprobanteForm = {
  cliente_id: "",
  tipo_comprobante: "B",
  descripcion_concepto: "",
  importe_neto: "",
  alicuota_iva: "21",
  fecha_emision: "",
};

const FORM_HON_INICIAL: NuevoHonorarioForm = {
  cliente_id: "",
  descripcion: "Honorarios profesionales",
  importe_neto: "",
  alicuota_iva: "21",
  tipo_comprobante: "B",
  dia_emision: "1",
};

export default function FacturacionPage() {
  const [tab, setTab] = useState<"comprobantes" | "honorarios" | "config">("comprobantes");
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [honorarios, setHonorarios] = useState<HonorarioRecurrente[]>([]);
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);

  // Modal comprobante
  const [modalComp, setModalComp] = useState(false);
  const [formComp, setFormComp] = useState<NuevoComprobanteForm>(FORM_COMP_INICIAL);
  const [guardandoComp, setGuardandoComp] = useState(false);

  // Modal honorario
  const [modalHon, setModalHon] = useState(false);
  const [formHon, setFormHon] = useState<NuevoHonorarioForm>(FORM_HON_INICIAL);
  const [guardandoHon, setGuardandoHon] = useState(false);

  // Config ARCA
  const [formConfig, setFormConfig] = useState({
    cuit: "",
    punto_venta: "1",
    certificado_b64: "",
    clave_privada_b64: "",
    modo: "homologacion",
  });
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const [c, h, cl] = await Promise.all([
        facturacionApi.listarComprobantes(),
        facturacionApi.listarHonorarios(),
        clientesApi.listar({ limit: 500 }),
      ]);
      setComprobantes(c);
      setHonorarios(h);
      setClientes(cl.map((x: any) => ({ id: x.id, nombre: x.nombre })));
    } catch (err: any) {
      setErrorCarga(err.message ?? "Error al cargar facturación");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (tab === "config") {
      facturacionApi.obtenerConfig().then((d) => {
        setConfig(d);
        if (d) {
          setFormConfig({
            cuit: d.cuit ?? "",
            punto_venta: String(d.punto_venta ?? "1"),
            certificado_b64: d.certificado_b64 ?? "",
            clave_privada_b64: d.clave_privada_b64 ?? "",
            modo: d.modo ?? "homologacion",
          });
        }
      }).catch(() => {});
    }
  }, [tab]);

  const handleEmitirComprobante = async () => {
    if (!formComp.cliente_id || !formComp.importe_neto) return;
    setGuardandoComp(true);
    try {
      await facturacionApi.emitirComprobante({
        cliente_id: Number(formComp.cliente_id),
        tipo_comprobante: formComp.tipo_comprobante,
        descripcion_concepto: formComp.descripcion_concepto || undefined,
        importe_neto: Number(formComp.importe_neto),
        alicuota_iva: Number(formComp.alicuota_iva),
        fecha_emision: formComp.fecha_emision || undefined,
      });
      setModalComp(false);
      setFormComp(FORM_COMP_INICIAL);
      await cargar();
    } catch (e: any) {
      alert(e.message ?? "Error al emitir comprobante");
    } finally {
      setGuardandoComp(false);
    }
  };

  const handleCrearHonorario = async () => {
    if (!formHon.cliente_id || !formHon.importe_neto) return;
    setGuardandoHon(true);
    try {
      await facturacionApi.crearHonorario({
        cliente_id: Number(formHon.cliente_id),
        descripcion: formHon.descripcion,
        importe_neto: Number(formHon.importe_neto),
        alicuota_iva: Number(formHon.alicuota_iva),
        tipo_comprobante: formHon.tipo_comprobante,
        dia_emision: Number(formHon.dia_emision),
      });
      setModalHon(false);
      setFormHon(FORM_HON_INICIAL);
      await cargar();
    } catch (e: any) {
      alert(e.message ?? "Error al crear honorario recurrente");
    } finally {
      setGuardandoHon(false);
    }
  };

  const handleEmitirHonorarioAhora = async (id: number) => {
    try {
      await facturacionApi.emitirHonorarioAhora(id);
      await cargar();
    } catch (e: any) {
      alert(e.message ?? "Error al emitir");
    }
  };

  const handleEnviar = async (id: number) => {
    try {
      await facturacionApi.enviarComprobante(id);
      await cargar();
    } catch (e: any) {
      alert(e.message ?? "Error al enviar");
    }
  };

  const handleGuardarConfig = async () => {
    setGuardandoConfig(true);
    try {
      await facturacionApi.guardarConfig({
        cuit: formConfig.cuit,
        punto_venta: Number(formConfig.punto_venta),
        certificado_b64: formConfig.certificado_b64,
        clave_privada_b64: formConfig.clave_privada_b64,
        modo: formConfig.modo,
      });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
    } catch (e: any) {
      alert(e.message ?? "Error al guardar configuración");
    } finally {
      setGuardandoConfig(false);
    }
  };

  const totalFacturado = comprobantes
    .filter((c) => c.estado !== "error")
    .reduce((sum, c) => sum + c.importe_total, 0);

  const pendientesEnvio = comprobantes.filter((c) => c.estado === "pendiente").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Facturación"
        description="Comprobantes ARCA/AFIP y honorarios recurrentes"
        actions={
          tab === "comprobantes" ? (
            <button
              onClick={() => { setFormComp(FORM_COMP_INICIAL); setModalComp(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo comprobante
            </button>
          ) : tab === "honorarios" ? (
            <button
              onClick={() => { setFormHon(FORM_HON_INICIAL); setModalHon(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo honorario
            </button>
          ) : null
        }
      />

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total facturado</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalFacturado)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Comprobantes</p>
          <p className="text-xl font-bold text-gray-900">{comprobantes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Pendientes de envío</p>
          <p className={cn("text-xl font-bold", pendientesEnvio > 0 ? "text-amber-600" : "text-gray-900")}>
            {pendientesEnvio}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {([
          { value: "comprobantes", label: "Comprobantes" },
          { value: "honorarios", label: "Honorarios recurrentes" },
          { value: "config", label: "Config ARCA" },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              tab === value ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {errorCarga && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-2">
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Error al cargar</p>
            <p className="text-xs text-red-500">{errorCarga}</p>
          </div>
          <button onClick={() => cargar()} className="text-xs text-red-600 hover:underline">Reintentar</button>
        </div>
      )}
      {tab === "comprobantes" && (
        loading ? (
          <LoadingTable rows={6} />
        ) : comprobantes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin comprobantes"
            description="Emití tu primer comprobante ARCA desde el botón de arriba"
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              {["Cliente", "Tipo", "Importe", "Fecha", "Estado", ""].map((h) => (
                <span key={h} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {comprobantes.map((c) => {
                const cliente = clientes.find((cl) => cl.id === c.cliente_id);
                return (
                  <div key={c.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {cliente?.nombre ?? `Cliente #${c.cliente_id}`}
                      </p>
                      {c.cae && (
                        <p className="text-[10px] text-gray-400 font-mono">CAE: {c.cae}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">{c.tipo_comprobante}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(c.importe_total)}</p>
                      <p className="text-[10px] text-gray-400">IVA {c.alicuota_iva}%</p>
                    </div>
                    <span className="text-xs text-gray-600">{formatFecha(c.fecha_emision)}</span>
                    <span className={cn(
                      "inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      ESTADO_COLOR[c.estado] ?? "bg-gray-100 text-gray-600"
                    )}>
                      {c.estado}
                    </span>
                    <div className="flex gap-1">
                      {c.estado === "pendiente" && (
                        <button
                          onClick={() => handleEnviar(c.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Enviar por email"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {tab === "honorarios" && (
        loading ? (
          <LoadingTable rows={4} />
        ) : honorarios.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Sin honorarios recurrentes"
            description="Configurá honorarios mensuales automáticos para tus clientes"
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
              {["Cliente", "Descripción", "Importe", "Día emisión", "Estado", ""].map((h) => (
                <span key={h} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-50">
              {honorarios.map((h) => {
                const cliente = clientes.find((cl) => cl.id === h.cliente_id);
                const importe_total = h.importe_neto * (1 + h.alicuota_iva / 100);
                return (
                  <div key={h.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_80px] gap-3 px-4 py-3 items-center">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {cliente?.nombre ?? `Cliente #${h.cliente_id}`}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{h.descripcion}</p>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(importe_total)}</p>
                      <p className="text-[10px] text-gray-400">IVA {h.alicuota_iva}%</p>
                    </div>
                    <span className="text-xs text-gray-600">Día {h.dia_emision}</span>
                    <span className={cn(
                      "inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      h.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {h.activo ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      onClick={() => handleEmitirHonorarioAhora(h.id)}
                      className="text-[11px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors font-medium"
                    >
                      Emitir ya
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {tab === "config" && (
        <div className="max-w-xl space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              Configuración ARCA
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">CUIT del estudio</label>
              <input
                value={formConfig.cuit}
                onChange={(e) => setFormConfig((p) => ({ ...p, cuit: e.target.value.replace(/\D/g, "") }))}
                placeholder="20123456789"
                maxLength={11}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Punto de venta</label>
              <input
                type="number"
                value={formConfig.punto_venta}
                onChange={(e) => setFormConfig((p) => ({ ...p, punto_venta: e.target.value }))}
                min={1}
                placeholder="1"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Modo</label>
              <select
                value={formConfig.modo}
                onChange={(e) => setFormConfig((p) => ({ ...p, modo: e.target.value }))}
                className={inputCls}
              >
                <option value="homologacion">Homologación (pruebas)</option>
                <option value="produccion">Producción</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Certificado AFIP (Base64)
              </label>
              <textarea
                value={formConfig.certificado_b64}
                onChange={(e) => setFormConfig((p) => ({ ...p, certificado_b64: e.target.value }))}
                rows={4}
                placeholder="Pegá el certificado en Base64..."
                className={cn(inputCls, "resize-none font-mono text-xs")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Clave privada (Base64)
              </label>
              <textarea
                value={formConfig.clave_privada_b64}
                onChange={(e) => setFormConfig((p) => ({ ...p, clave_privada_b64: e.target.value }))}
                rows={4}
                placeholder="Pegá la clave privada en Base64..."
                className={cn(inputCls, "resize-none font-mono text-xs")}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {configSaved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Guardado
                </span>
              )}
              <button
                onClick={handleGuardarConfig}
                disabled={guardandoConfig}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {guardandoConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings className="h-3.5 w-3.5" />}
                {guardandoConfig ? "Guardando..." : "Guardar configuración"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nuevo Comprobante ── */}
      {modalComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Nuevo comprobante</h2>
              <button onClick={() => setModalComp(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  value={formComp.cliente_id}
                  onChange={(e) => setFormComp({ ...formComp, cliente_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">— Elegir cliente —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formComp.tipo_comprobante}
                    onChange={(e) => setFormComp({ ...formComp, tipo_comprobante: e.target.value })}
                    className={inputCls}
                  >
                    {TIPOS_COMPROBANTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">IVA %</label>
                  <select
                    value={formComp.alicuota_iva}
                    onChange={(e) => setFormComp({ ...formComp, alicuota_iva: e.target.value })}
                    className={inputCls}
                  >
                    <option value="0">0%</option>
                    <option value="10.5">10.5%</option>
                    <option value="21">21%</option>
                    <option value="27">27%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción del concepto</label>
                <input
                  value={formComp.descripcion_concepto}
                  onChange={(e) => setFormComp({ ...formComp, descripcion_concepto: e.target.value })}
                  placeholder="Ej: Honorarios profesionales junio 2024"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Importe neto *</label>
                  <input
                    type="number"
                    value={formComp.importe_neto}
                    onChange={(e) => setFormComp({ ...formComp, importe_neto: e.target.value })}
                    placeholder="50000"
                    min={0}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha emisión</label>
                  <input
                    type="date"
                    value={formComp.fecha_emision}
                    onChange={(e) => setFormComp({ ...formComp, fecha_emision: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              {formComp.importe_neto && (
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-500">Total c/IVA: </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(Number(formComp.importe_neto) * (1 + Number(formComp.alicuota_iva) / 100))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModalComp(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleEmitirComprobante}
                disabled={!formComp.cliente_id || !formComp.importe_neto || guardandoComp}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {guardandoComp ? "Emitiendo..." : "Emitir comprobante"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nuevo Honorario ── */}
      {modalHon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Honorario recurrente</h2>
              <button onClick={() => setModalHon(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  value={formHon.cliente_id}
                  onChange={(e) => setFormHon({ ...formHon, cliente_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">— Elegir cliente —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  value={formHon.descripcion}
                  onChange={(e) => setFormHon({ ...formHon, descripcion: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Importe neto *</label>
                  <input
                    type="number"
                    value={formHon.importe_neto}
                    onChange={(e) => setFormHon({ ...formHon, importe_neto: e.target.value })}
                    placeholder="50000"
                    min={0}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">IVA %</label>
                  <select
                    value={formHon.alicuota_iva}
                    onChange={(e) => setFormHon({ ...formHon, alicuota_iva: e.target.value })}
                    className={inputCls}
                  >
                    <option value="0">0%</option>
                    <option value="10.5">10.5%</option>
                    <option value="21">21%</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo comprobante</label>
                  <select
                    value={formHon.tipo_comprobante}
                    onChange={(e) => setFormHon({ ...formHon, tipo_comprobante: e.target.value })}
                    className={inputCls}
                  >
                    {TIPOS_COMPROBANTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Día del mes</label>
                  <input
                    type="number"
                    value={formHon.dia_emision}
                    onChange={(e) => setFormHon({ ...formHon, dia_emision: e.target.value })}
                    min={1}
                    max={28}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModalHon(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleCrearHonorario}
                disabled={!formHon.cliente_id || !formHon.importe_neto || guardandoHon}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {guardandoHon ? "Guardando..." : "Crear honorario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-gray-300 bg-white";
