"use client";

import { Bell, DollarSign, AlertTriangle, ClipboardList, FileWarning, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResumenAlertasData {
  vencimiento: number;
  mora: number;
  riesgo: number;
  tarea_vencida: number;
  documentacion: number;
  manual: number;
  total: number;
}

const TIPOS_CONFIG = [
  { key: "vencimiento", label: "Vencimientos", icon: Bell, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { key: "mora", label: "Mora", icon: DollarSign, color: "text-red-600 bg-red-50 border-red-200" },
  { key: "riesgo", label: "Riesgo", icon: AlertTriangle, color: "text-orange-600 bg-orange-50 border-orange-200" },
  { key: "tarea_vencida", label: "Tareas", icon: ClipboardList, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { key: "documentacion", label: "Documentación", icon: FileWarning, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { key: "manual", label: "Manuales", icon: MessageSquare, color: "text-gray-600 bg-gray-50 border-gray-200" },
] as const;

interface Props {
  data: ResumenAlertasData;
  onTipoClick?: (tipo: string) => void;
  compact?: boolean;
}

export function ResumenAlertas({ data, onTipoClick, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {TIPOS_CONFIG.filter(t => data[t.key as keyof ResumenAlertasData] > 0).map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => onTipoClick?.(key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-opacity hover:opacity-80",
              color
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            <span className="font-bold">{data[key as keyof ResumenAlertasData]}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {TIPOS_CONFIG.map(({ key, label, icon: Icon, color }) => {
        const count = data[key as keyof ResumenAlertasData] as number;
        return (
          <button
            key={key}
            onClick={() => onTipoClick?.(key)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md hover:scale-105",
              count > 0 ? color : "text-gray-400 bg-gray-50 border-gray-200 opacity-60"
            )}
          >
            <Icon className="w-6 h-6" />
            <div className="text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs font-medium">{label}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
