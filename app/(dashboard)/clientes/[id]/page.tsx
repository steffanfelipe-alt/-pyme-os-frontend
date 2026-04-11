"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, CheckCircle2, FileText, Zap, Phone, Mail,
  AlertTriangle, Edit2,
} from "lucide-react";
import { clientesApi } from "@/lib/api";
import { RiskBadge } from "@/components/clientes/RiskBadge";
import {
  formatFecha, diasRestantesLabel, condicionFiscalLabel,
  tipoVencimientoLabel, formatCurrency, cn,
} from "@/lib/utils";
import type { FichaCliente } from "@/types/cliente";

export default function FichaClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ficha, setFicha] = useState<FichaCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculatingRisk, setCalculatingRisk] = useState(false);

  const cargar = () =>
    clientesApi.ficha(Number(id)).then(setFicha).finally(() => setLoading(false));

  useEffect(() => { cargar(); }, [id]);

  const handleCalcularRisk = async () => {
    setCalculatingRisk(true);
    await clientesApi.calcularRisk(Number(id)).catch(() => {});
    await cargar();
    setCalculatingRisk(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!ficha) {
    return <div className="text-center py-20 text-gray-400">Cliente no encontrado</div>;
  }

  const { cliente, contador_principal, vencimientos, tareas, documentos, estado_alerta } = ficha;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-1 p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        >
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
                    <span className="text-gray-600 font-medium">
                      {formatCurrency(Number(cliente.honorarios_mensuales))}/mes
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <RiskBadge nivel={estado_alerta} size="md" />
              <button
                onClick={handleCalcularRisk}
                disabled={calculatingRisk}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <Zap className="h-3 w-3" />
                {calculatingRisk ? "Calculando..." : "Recalcular riesgo"}
              </button>
              <button
                onClick={() => router.push(`/clientes/${id}/editar`)}
                className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-3 w-3" />
                Editar
              </button>
            </div>
          </div>

          {/* Risk explanation */}
          {cliente.risk_explanation && (
            <div
              className={cn(
                "mt-3 text-sm p-3 rounded-lg border-l-4",
                cliente.risk_level === "rojo" ? "bg-red-50 border-red-400 text-red-700" :
                cliente.risk_level === "amarillo" ? "bg-amber-50 border-amber-400 text-amber-700" :
                "bg-green-50 border-green-400 text-green-700"
              )}
            >
              <span className="font-medium">Análisis IA:</span> {cliente.risk_explanation}
              {cliente.risk_score !== null && (
                <span className="ml-2 text-xs opacity-60">(score: {cliente.risk_score.toFixed(0)}/100)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vencimientos */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            Vencimientos
          </h3>
          {vencimientos.proximos.length === 0 && vencimientos.vencidos.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Sin vencimientos activos</p>
          ) : (
            <div className="space-y-2">
              {vencimientos.vencidos.map((v) => (
                <div key={v.id} className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-red-700">{tipoVencimientoLabel(v.tipo)}</span>
                    <span className="text-[10px] text-red-500 bg-red-100 px-1.5 rounded font-medium">VENCIDO</span>
                  </div>
                  <p className="text-xs text-red-500 mt-0.5">{v.descripcion}</p>
                </div>
              ))}
              {vencimientos.proximos.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "p-2.5 rounded-lg border",
                    v.dias_para_vencer <= 3 ? "bg-red-50 border-red-100" :
                    v.dias_para_vencer <= 7 ? "bg-amber-50 border-amber-100" :
                    "bg-gray-50 border-gray-100"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-gray-700">{tipoVencimientoLabel(v.tipo)}</span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      v.dias_para_vencer <= 3 ? "text-red-600" :
                      v.dias_para_vencer <= 7 ? "text-amber-600" : "text-gray-400"
                    )}>
                      {diasRestantesLabel(v.dias_para_vencer)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{v.descripcion}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tareas */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
            Tareas activas
            {tareas.activas.length > 0 && (
              <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {tareas.activas.length}
              </span>
            )}
          </h3>
          {tareas.activas.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Sin tareas activas</p>
          ) : (
            <div className="space-y-2">
              {tareas.activas.map((t) => {
                const vencida = t.fecha_limite && new Date(t.fecha_limite) < new Date();
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "p-2.5 rounded-lg border",
                      vencida ? "bg-red-50 border-red-100" :
                      t.prioridad === "alta" || t.prioridad === "urgente" ? "bg-amber-50 border-amber-100" :
                      "bg-gray-50 border-gray-100"
                    )}
                  >
                    <p className="text-xs font-medium text-gray-800">{t.titulo}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className={cn("text-[10px] capitalize",
                        t.prioridad === "alta" || t.prioridad === "urgente" ? "text-amber-600 font-medium" : "text-gray-400"
                      )}>
                        {t.prioridad}
                      </span>
                      {t.fecha_limite && (
                        <span className={cn("text-[10px]", vencida ? "text-red-500 font-medium" : "text-gray-400")}>
                          · {formatFecha(t.fecha_limite)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info + documentos */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Información</h3>
            <div className="space-y-2.5">
              {cliente.email && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <a href={`mailto:${cliente.email}`} className="hover:text-blue-600 truncate">
                    {cliente.email}
                  </a>
                </div>
              )}
              {cliente.telefono && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {cliente.telefono}
                </div>
              )}
              {contador_principal && (
                <div className="flex items-center gap-2 text-xs text-gray-600 pt-2 border-t border-gray-50">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                    {contador_principal.nombre.charAt(0)}
                  </div>
                  <span className="text-gray-500">Contador: {contador_principal.nombre}</span>
                </div>
              )}
              {!cliente.email && !cliente.telefono && !contador_principal && (
                <p className="text-xs text-gray-400 py-2">Sin datos de contacto</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Documentos
              <span className="ml-auto text-xs text-gray-400">{documentos.length}</span>
            </h3>
            {documentos.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">Sin documentos cargados</p>
            ) : (
              <div className="space-y-1.5">
                {documentos.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-xs">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      doc.estado === "procesado" ? "bg-green-500" :
                      doc.estado === "error" ? "bg-red-500" : "bg-amber-400"
                    )} />
                    <span className="text-gray-600 truncate">{doc.nombre_original}</span>
                    <span className="text-gray-300 ml-auto shrink-0">{formatFecha(doc.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notas */}
      {cliente.notas && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Notas internas</p>
          <p className="text-sm text-amber-800">{cliente.notas}</p>
        </div>
      )}
    </div>
  );
}
