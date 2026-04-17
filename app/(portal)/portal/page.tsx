"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Calendar, CreditCard, LogOut, ChevronRight, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { portalApi, clearPortalToken, isPortalAuthenticated, type PortalFicha } from "@/lib/portal-api";

function diasColor(dias: number) {
  if (dias < 0) return "text-red-600 bg-red-50 border-red-200";
  if (dias <= 3) return "text-red-600 bg-red-50 border-red-200";
  if (dias <= 7) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

function diasLabel(dias: number) {
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} días`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días`;
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

export default function PortalHomePage() {
  const router = useRouter();
  const [ficha, setFicha] = useState<PortalFicha | null>(null);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!isPortalAuthenticated()) {
      router.replace("/portal/login");
      return;
    }
    setLoading(true);
    try {
      const data = await portalApi.ficha();
      setFicha(data);
    } catch {
      router.replace("/portal/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleLogout = () => {
    clearPortalToken();
    router.replace("/portal/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ficha) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">{ficha.cliente.nombre}</h1>
            <p className="text-xs text-gray-400">{ficha.cliente.cuit_cuil}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/portal/notificaciones")}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-500" />
              {ficha.notificaciones_no_leidas > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {ficha.notificaciones_no_leidas > 9 ? "9+" : ficha.notificaciones_no_leidas}
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Cerrar sesión">
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Abono */}
        {ficha.abono_estado && (
          <div className={`p-4 rounded-2xl border ${ficha.abono_estado.estado === "pagado" ? "bg-green-50 border-green-200" : ficha.abono_estado.estado === "vencido" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Abono mensual</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(ficha.abono_estado.monto)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Período: {ficha.abono_estado.periodo}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${ficha.abono_estado.estado === "pagado" ? "bg-green-100 text-green-700" : ficha.abono_estado.estado === "vencido" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                {ficha.abono_estado.estado === "pagado" ? "Al día" : ficha.abono_estado.estado === "vencido" ? "Vencido" : "Pendiente"}
              </div>
            </div>
          </div>
        )}

        {/* Vencimientos próximos */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-800">Próximos vencimientos</h2>
            </div>
            <button onClick={() => router.push("/portal/vencimientos")} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {ficha.vencimientos_proximos.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No hay vencimientos próximos</p>
              </div>
            ) : ficha.vencimientos_proximos.slice(0, 5).map(v => (
              <div key={v.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{v.tipo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.descripcion}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${diasColor(v.dias_para_vencer)}`}>
                  <Clock className="w-3 h-3" />
                  {diasLabel(v.dias_para_vencer)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/portal/vencimientos")}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <Calendar className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm font-semibold text-gray-800">Vencimientos</p>
            <p className="text-xs text-gray-400 mt-0.5">Ver todos los vencimientos fiscales</p>
          </button>
          <button
            onClick={() => router.push("/portal/notificaciones")}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <div className="relative inline-block">
              <Bell className="w-6 h-6 text-orange-500 mb-2" />
              {ficha.notificaciones_no_leidas > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {ficha.notificaciones_no_leidas}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800">Notificaciones</p>
            <p className="text-xs text-gray-400 mt-0.5">Mensajes de tu estudio contable</p>
          </button>
          <button
            onClick={() => router.push("/portal/cuenta")}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <CreditCard className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm font-semibold text-gray-800">Mis cobros</p>
            <p className="text-xs text-gray-400 mt-0.5">Historial de abonos y pagos</p>
          </button>
          <button
            onClick={() => router.push("/portal/documentos")}
            className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <AlertCircle className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm font-semibold text-gray-800">Documentos</p>
            <p className="text-xs text-gray-400 mt-0.5">Subir y ver documentos</p>
          </button>
        </div>
      </main>
    </div>
  );
}
