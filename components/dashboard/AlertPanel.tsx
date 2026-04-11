"use client";

import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn, tipoVencimientoLabel } from "@/lib/utils";
import type { VencimientoSinDoc } from "@/types/dashboard";

interface AlertPanelProps {
  items: VencimientoSinDoc[];
  onResolve?: (clienteId: number) => void;
}

const URGENCY = {
  CRITICO: { color: "border-l-red-500 bg-red-50",   badge: "bg-red-100 text-red-700",   icon: "text-red-500",   label: "CRÍTICO" },
  URGENTE: { color: "border-l-amber-500 bg-amber-50", badge: "bg-amber-100 text-amber-700", icon: "text-amber-500", label: "URGENTE" },
  PROXIMO: { color: "border-l-blue-400 bg-blue-50",  badge: "bg-blue-100 text-blue-700",  icon: "text-blue-500",  label: "PRÓXIMO" },
};

export function AlertPanel({ items, onResolve }: AlertPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 py-4">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">Sin vencimientos críticos pendientes</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 8).map((item, idx) => {
        const cfg = URGENCY[item.urgencia];
        return (
          <div
            key={idx}
            className={cn("flex items-center gap-3 p-3 rounded-lg border-l-4", cfg.color)}
          >
            <AlertTriangle className={cn("h-4 w-4 shrink-0", cfg.icon)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800 truncate">
                  {item.cliente_nombre}
                </span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0", cfg.badge)}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {tipoVencimientoLabel(item.tipo)} · vence en{" "}
                <span className="font-medium">
                  {item.dias_restantes === 0 ? "hoy" : `${item.dias_restantes}d`}
                </span>
                {item.contador_nombre && ` · ${item.contador_nombre}`}
              </p>
            </div>
            {onResolve && (
              <button
                onClick={() => onResolve(item.cliente_id)}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 shrink-0"
              >
                Ver <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
      {items.length > 8 && (
        <p className="text-xs text-gray-400 text-center pt-1">
          +{items.length - 8} vencimientos más
        </p>
      )}
    </div>
  );
}
