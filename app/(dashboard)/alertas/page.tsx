"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Plus, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ResumenAlertas, type ResumenAlertasData } from "@/components/alertas/ResumenAlertas";
import { AlertaManualModal } from "@/components/alertas/AlertaManualModal";

export default function AlertasPage() {
  const router = useRouter();
  const [resumen, setResumen] = useState<ResumenAlertasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ResumenAlertasData>("/alertas/resumen");
      setResumen(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      await apiFetch("/alertas/generar-triggers", { method: "POST" });
      await cargar();
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Bell className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
            <p className="text-sm text-gray-500">
              {resumen ? `${resumen.total} alerta${resumen.total !== 1 ? "s" : ""} activa${resumen.total !== 1 ? "s" : ""}` : "Cargando..."}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${generando ? "animate-spin" : ""}`} />
            {generando ? "Generando..." : "Actualizar"}
          </button>
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva alerta manual
          </button>
        </div>
      </div>

      {/* Resumen por tipo */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : resumen ? (
        <ResumenAlertas
          data={resumen}
          onTipoClick={(tipo) => router.push(`/alertas/${tipo}`)}
        />
      ) : null}

      {/* Info */}
      {!loading && resumen && resumen.total === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-gray-500">No hay alertas activas</p>
          <p className="text-sm mt-1">El sistema está al día. ¡Buen trabajo!</p>
        </div>
      )}

      {/* Instrucción */}
      {!loading && resumen && resumen.total > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Hacé click en una tarjeta para ver el detalle de ese tipo de alertas
        </p>
      )}

      <AlertaManualModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSuccess={cargar}
      />
    </div>
  );
}
