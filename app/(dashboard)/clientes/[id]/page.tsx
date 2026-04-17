"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, CheckCircle2, FileText, Zap, Phone, Mail,
  AlertTriangle, Edit2, Bell, DollarSign, Globe, StickyNote,
} from "lucide-react";
import { apiFetch, clientesApi } from "@/lib/api";
import { RiskBadge } from "@/components/clientes/RiskBadge";
import {
  formatFecha, diasRestantesLabel, condicionFiscalLabel,
  tipoVencimientoLabel, formatCurrency, cn,
} from "@/lib/utils";
import type { FichaCliente } from "@/types/cliente";
import { useToast } from "@/hooks/useToast";

type Tab = "vencimientos" | "tareas" | "documentos" | "alertas" | "honorarios" | "portal" | "notas";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "vencimientos", label: "Vencimientos", icon: Clock },
  { id: "tareas", label: "Tareas", icon: CheckCircle2 },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "honorarios", label: "Honorarios", icon: DollarSign },
  { id: "portal", label: "Portal", icon: Globe },
  { id: "notas", label: "Notas", icon: StickyNote },
];

export default function FichaClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [ficha, setFicha] = useState<FichaCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculatingRisk, setCalculatingRisk] = useState(false);
  const [tabActivo, setTabActivo] = useState<Tab>("vencimientos");
  const [notas, setNotas] = useState("");
  const [savingNotas, setSavingNotas] = useState(false);
  const [portalEmail, setPortalEmail] = useState("");
  const [habilitandoPortal, setHabilitandoPortal] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientesApi.ficha(Number(id));
      setFicha(data);
      setNotas(data.notas ?? "");
      setPortalEmail(data.portal?.email ?? "");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCalcularRisk = async () => {
    setCalculatingRisk(true);
    await clientesApi.calcularRisk(Number(id)).catch(() => {});
    await cargar();
    setCalculatingRisk(false);
  };

  const handleGuardarNotas = async () => {
    setSavingNotas(true);
    try {
      await apiFetch(`/api/clientes/${id}/notas`, {
        method: "PATCH",
        body: JSON.stringify({ notas }),
      });
      toast.success("Notas guardadas");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar notas");
    } finally {
      setSavingNotas(false);
    }
  };

  const handleHabilitarPortal = async () => {
    if (!portalEmail) { toast.error("El email es obligatorio"); return; }
    setHabilitandoPortal(true);
    try {
      await apiFetch(`/portal/auth/habilitar-cliente`, {
        method: "POST",
        body: JSON.stringify({ cliente_id: Number(id), email: portalEmail }),
      });
      toast.success("Acceso al portal habilitado");
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al habilitar portal");
    } finally {
      setHabilitandoPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!ficha) {
    return <div className="text-center py-20 text-gray-400">Cliente no encontrado</div>;
  }

  const { cliente, contador_principal, vencimientos, tareas, documentos, estado_alerta, alertas_activas, abono, historial_cobros, portal, resumen } = ficha;

  // Badges de tabs con contadores
  const tabBadges: Partial<Record<Tab, number>> = {
    vencimientos: (vencimientos.proximos.length + vencimientos.vencidos.length) || 0,
    tareas: tareas.activas.length || 0,
    alertas: alertas_activas?.length || 0,
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.back()} className="mt-1 p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900">{cliente.nombre}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-400">
                <span>{cliente.cuit_cuil}</span>
                <span className="text-gray-200">·</span>
                <span>{condicionFiscalLabel(cliente.condicion_fiscal)}</span>
                {cliente.honorarios_mensuales && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="text-gray-600 font-medium">{formatCurrency(Number(cliente.honorarios_mensuales))}/mes</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <RiskBadge nivel={estado_alerta} size="md" />
              <button onClick={handleCalcularRisk} disabled={calculatingRisk}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">
                <Zap className="h-3 w-3" />
                {calculatingRisk ? "Calculando..." : "Recalcular riesgo"}
              </button>
              <button onClick={() => router.push(`/clientes/${id}/editar`)}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit2 className="h-3 w-3" />
                Editar
              </button>
            </div>
          </div>

          {/* Resumen ejecutivo */}
          {resumen && (
            <div className="flex gap-4 mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              {[
                { label: "Score riesgo", value: resumen.score_riesgo !== null ? `${resumen.score_riesgo}/100` : "—" },
                { label: "Alertas activas", value: String(resumen.alertas_activas) },
                { label: "Vctos 7 días", value: String(resumen.vencimientos_proximos_7_dias) },
                { label: "Tareas pendientes", value: String(resumen.tareas_pendientes) },
                { label: "Honorario", value: resumen.honorario_base ? formatCurrency(resumen.honorario_base) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-lg font-bold text-gray-800">{value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {cliente.risk_explanation && (
            <div className={cn("mt-3 text-sm p-3 rounded-lg border-l-4",
              cliente.risk_level === "rojo" ? "bg-red-50 border-red-400 text-red-700" :
              cliente.risk_level === "amarillo" ? "bg-amber-50 border-amber-400 text-amber-700" :
              "bg-green-50 border-green-400 text-green-700")}>
              <span className="font-medium">Análisis IA:</span> {cliente.risk_explanation}
              {cliente.risk_score !== null && (
                <span className="ml-2 text-xs opacity-60">(score: {cliente.risk_score.toFixed(0)}/100)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info rápida */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {cliente.email && (
          <a href={`mailto:${cliente.email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
            <Mail className="h-3.5 w-3.5" />{cliente.email}
          </a>
        )}
        {cliente.telefono && (
          <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{cliente.telefono}</span>
        )}
        {contador_principal && (
          <span className="flex items-center gap-1.5 text-gray-400">
            Contador: {contador_principal.nombre}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tabBadges[tab.id];
            const activo = tabActivo === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActivo(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  activo
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {badge !== undefined && badge > 0 && (
                  <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    activo ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500")}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de tabs */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">

        {/* Vencimientos */}
        {tabActivo === "vencimientos" && (
          <div className="space-y-2">
            {vencimientos.vencidos.length === 0 && vencimientos.proximos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin vencimientos activos</p>
            ) : (
              <>
                {vencimientos.vencidos.map(v => (
                  <div key={v.id} className="p-3 rounded-lg bg-red-50 border border-red-100">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-red-700">{tipoVencimientoLabel(v.tipo)}</span>
                      <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded font-medium">VENCIDO</span>
                    </div>
                    <p className="text-xs text-red-500 mt-0.5">{v.descripcion}</p>
                  </div>
                ))}
                {vencimientos.proximos.map(v => (
                  <div key={v.id} className={cn("p-3 rounded-lg border",
                    v.dias_para_vencer <= 3 ? "bg-red-50 border-red-100" :
                    v.dias_para_vencer <= 7 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100")}>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-gray-700">{tipoVencimientoLabel(v.tipo)}</span>
                      <span className={cn("text-xs font-medium",
                        v.dias_para_vencer <= 3 ? "text-red-600" :
                        v.dias_para_vencer <= 7 ? "text-amber-600" : "text-gray-400")}>
                        {diasRestantesLabel(v.dias_para_vencer)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{v.descripcion}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatFecha(v.fecha_vencimiento)}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Tareas */}
        {tabActivo === "tareas" && (
          <div className="space-y-2">
            {tareas.activas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin tareas activas</p>
            ) : tareas.activas.map(t => {
              const vencida = t.fecha_limite && new Date(t.fecha_limite) < new Date();
              return (
                <div key={t.id} className={cn("p-3 rounded-lg border",
                  vencida ? "bg-red-50 border-red-100" :
                  t.prioridad === "alta" || t.prioridad === "urgente" ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100")}>
                  <p className="text-sm font-medium text-gray-800">{t.titulo}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span className={cn("capitalize", t.prioridad === "alta" || t.prioridad === "urgente" ? "text-amber-600 font-medium" : "")}>
                      {t.prioridad}
                    </span>
                    {t.fecha_limite && (
                      <span className={vencida ? "text-red-500 font-medium" : ""}>{formatFecha(t.fecha_limite)}</span>
                    )}
                    <span className="capitalize">{t.estado}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Documentos */}
        {tabActivo === "documentos" && (
          <div className="space-y-2">
            {documentos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin documentos cargados</p>
            ) : documentos.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  doc.estado === "procesado" ? "bg-green-500" :
                  doc.estado === "error" ? "bg-red-500" : "bg-amber-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{doc.nombre_original}</p>
                  <p className="text-xs text-gray-400">{doc.tipo_documento}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatFecha(doc.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Alertas */}
        {tabActivo === "alertas" && (
          <div className="space-y-2">
            {!alertas_activas || alertas_activas.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin alertas activas</p>
              </div>
            ) : alertas_activas.map(alerta => (
              <div key={alerta.id} className={cn("p-3 rounded-lg border-l-4",
                alerta.nivel === "rojo" ? "border-red-400 bg-red-50" :
                alerta.nivel === "amarillo" ? "border-amber-400 bg-amber-50" : "border-blue-400 bg-blue-50")}>
                <p className="text-sm font-medium text-gray-800">{alerta.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{alerta.mensaje}</p>
                <p className="text-xs text-gray-400 mt-1">{formatFecha(alerta.created_at)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Honorarios */}
        {tabActivo === "honorarios" && (
          <div className="space-y-4">
            {abono && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Abono mensual</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(abono.monto)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Período: {abono.periodo}</p>
                  </div>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-medium",
                    abono.estado === "pagado" ? "bg-green-100 text-green-700" :
                    abono.estado === "vencido" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")}>
                    {abono.estado}
                  </span>
                </div>
              </div>
            )}
            {historial_cobros && historial_cobros.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Historial de cobros</p>
                <div className="space-y-2">
                  {historial_cobros.map(cobro => (
                    <div key={cobro.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(cobro.monto)}</p>
                        <p className="text-xs text-gray-400">{formatFecha(cobro.fecha_cobro)} · {cobro.medio_pago ?? "—"}</p>
                      </div>
                      <span className={cn("text-xs font-medium",
                        cobro.estado === "cobrado" ? "text-green-600" : "text-gray-400")}>
                        {cobro.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!abono && (!historial_cobros || historial_cobros.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">Sin información de honorarios</p>
            )}
          </div>
        )}

        {/* Portal */}
        {tabActivo === "portal" && (
          <div className="space-y-4">
            {portal?.tiene_acceso ? (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium text-green-800">Acceso al portal habilitado</p>
                </div>
                <p className="text-xs text-green-600">Email: {portal.email}</p>
                {portal.ultimo_login && (
                  <p className="text-xs text-green-500 mt-1">Último acceso: {formatFecha(portal.ultimo_login)}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500">Este cliente no tiene acceso al portal del cliente.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email para el portal</label>
                  <input
                    type="email"
                    value={portalEmail}
                    onChange={e => setPortalEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleHabilitarPortal}
                  disabled={habilitandoPortal || !portalEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {habilitandoPortal ? "Habilitando..." : "Habilitar acceso al portal"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Notas */}
        {tabActivo === "notas" && (
          <div className="space-y-4">
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={8}
              placeholder="Notas internas del estudio sobre este cliente..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleGuardarNotas}
              disabled={savingNotas}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {savingNotas ? "Guardando..." : "Guardar notas"}
            </button>
            <p className="text-xs text-gray-400">Las notas son internas y no son visibles por el cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
