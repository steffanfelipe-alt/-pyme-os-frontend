"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, CheckCircle2, Clock } from "lucide-react";
import { portalApi, isPortalAuthenticated, type PortalVencimiento } from "@/lib/portal-api";

function diasColor(dias: number) {
  if (dias < 0) return "border-red-300 bg-red-50 text-red-700";
  if (dias <= 3) return "border-red-200 bg-red-50 text-red-600";
  if (dias <= 7) return "border-amber-200 bg-amber-50 text-amber-600";
  return "border-gray-200 bg-white text-gray-600";
}

function diasLabel(dias: number) {
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? "s" : ""}`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `En ${dias} días`;
}

export default function PortalVencimientosPage() {
  const router = useRouter();
  const [vencimientos, setVencimientos] = useState<PortalVencimiento[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!isPortalAuthenticated()) { router.replace("/portal/login"); return; }
    try {
      const data = await portalApi.vencimientos();
      setVencimientos(data);
    } catch {
      router.replace("/portal/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  const proximos = vencimientos.filter(v => v.dias_para_vencer >= 0);
  const vencidos = vencimientos.filter(v => v.dias_para_vencer < 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/portal")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-semibold text-gray-900">Vencimientos fiscales</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : vencimientos.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Sin vencimientos pendientes</p>
            <p className="text-sm text-gray-400 mt-1">¡Todo al día!</p>
          </div>
        ) : (
          <>
            {vencidos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase mb-3">Vencidos ({vencidos.length})</p>
                <div className="space-y-2">
                  {vencidos.map(v => (
                    <div key={v.id} className="p-4 rounded-2xl border border-red-300 bg-red-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-red-800">{v.tipo}</p>
                          <p className="text-xs text-red-600 mt-0.5">{v.descripcion}</p>
                        </div>
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {diasLabel(v.dias_para_vencer)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {proximos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Próximos ({proximos.length})</p>
                <div className="space-y-2">
                  {proximos.map(v => (
                    <div key={v.id} className={`p-4 rounded-2xl border ${diasColor(v.dias_para_vencer)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{v.tipo}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{v.descripcion}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {diasLabel(v.dias_para_vencer)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
