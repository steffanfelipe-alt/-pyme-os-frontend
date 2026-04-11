"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, X, CheckCircle2 } from "lucide-react";
import { useAlertas } from "@/hooks/useAlertas";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function TopBar() {
  const { resumen, alertas, marcarVista } = useAlertas();
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const totalAlerts = (resumen?.criticas ?? 0) + (resumen?.advertencias ?? 0);
  const sinVer = alertas.filter((a) => !a.vista);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBell(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 w-72 hover:border-gray-200 transition-colors">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar cliente, vencimiento..."
          className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 outline-none w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Campana de alertas */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowBell(!showBell)}
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Bell className="h-4 w-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                <span className="text-white text-[9px] font-bold">
                  {totalAlerts > 9 ? "9+" : totalAlerts}
                </span>
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">Alertas</p>
                <button
                  onClick={() => setShowBell(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {sinVer.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-400" />
                    <p className="text-sm">Todo al día</p>
                  </div>
                ) : (
                  sinVer.slice(0, 10).map((a) => (
                    <div
                      key={a.id}
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 transition-colors",
                        a.nivel === "critica" && "border-l-2 border-l-red-500"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 leading-snug">
                            {a.mensaje}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.5 rounded",
                              a.nivel === "critica"
                                ? "bg-red-100 text-red-700"
                                : a.nivel === "advertencia"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            {a.nivel.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={() => marcarVista(a.id)}
                          className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0"
                        >
                          Vista
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-gray-50">
                <Link
                  href="/reportes"
                  onClick={() => setShowBell(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ver todas las alertas →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
