"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { portalApi, isPortalAuthenticated, type PortalNotificacion } from "@/lib/portal-api";

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PortalNotificacionesPage() {
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<PortalNotificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);

  const cargar = useCallback(async () => {
    if (!isPortalAuthenticated()) { router.replace("/portal/login"); return; }
    try {
      const data = await portalApi.notificaciones();
      setNotificaciones(data);
    } catch {
      router.replace("/portal/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleMarcarLeida = async (id: number) => {
    await portalApi.marcarLeida(id).catch(() => {});
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const handleMarcarTodas = async () => {
    setMarcando(true);
    await portalApi.marcarTodasLeidas().catch(() => {});
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setMarcando(false);
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/portal")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              <h1 className="text-base font-semibold text-gray-900">Notificaciones</h1>
              {noLeidas > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{noLeidas}</span>
              )}
            </div>
          </div>
          {noLeidas > 0 && (
            <button
              onClick={handleMarcarTodas}
              disabled={marcando}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {marcando ? "..." : "Marcar todas leídas"}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Sin notificaciones</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notificaciones.map(n => (
              <div
                key={n.id}
                onClick={() => !n.leida && handleMarcarLeida(n.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${n.leida ? "bg-white border-gray-100 opacity-70" : "bg-white border-blue-200 shadow-sm"}`}
              >
                <div className="flex items-start gap-3">
                  {!n.leida && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.leida ? "text-gray-600" : "text-gray-900"}`}>{n.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                    <p className="text-xs text-gray-300 mt-1.5">{formatFecha(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
