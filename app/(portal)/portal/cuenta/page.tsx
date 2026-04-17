"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, CheckCircle2 } from "lucide-react";
import { portalApi, isPortalAuthenticated, type PortalCobro } from "@/lib/portal-api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PortalCuentaPage() {
  const router = useRouter();
  const [cobros, setCobros] = useState<PortalCobro[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!isPortalAuthenticated()) { router.replace("/portal/login"); return; }
    try {
      const data = await portalApi.cobros();
      setCobros(data);
    } catch {
      router.replace("/portal/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/portal")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h1 className="text-base font-semibold text-gray-900">Historial de cobros</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : cobros.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Sin historial de cobros</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cobros.map(cobro => (
              <div key={cobro.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(cobro.monto)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cobro.periodo} · {cobro.estado === "cobrado" ? formatFecha(cobro.fecha_cobro) : "Pendiente"}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  cobro.estado === "cobrado" ? "bg-green-100 text-green-700" :
                  cobro.estado === "vencido" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {cobro.estado === "cobrado" ? "Pagado" : cobro.estado === "vencido" ? "Vencido" : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
