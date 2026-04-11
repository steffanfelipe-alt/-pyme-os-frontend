"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import {
  formatFechaRelativa,
  diasRestantesLabel,
  condicionFiscalLabel,
  cn,
} from "@/lib/utils";
import type { ClienteResumen } from "@/types/cliente";

interface ClienteTableProps {
  clientes: ClienteResumen[];
}

export function ClienteTable({ clientes }: ClienteTableProps) {
  if (clientes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No hay clientes para mostrar
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {["Cliente", "Condición fiscal", "Próx. vencimiento", "Últ. actividad", "Estado", ""].map(
          (h) => (
            <span
              key={h}
              className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
            >
              {h}
            </span>
          )
        )}
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {clientes.map((cliente) => {
          const isRed = cliente.estado_alerta === "rojo";
          const isYellow = cliente.estado_alerta === "amarillo";

          return (
            <Link
              key={cliente.id}
              href={`/clientes/${cliente.id}`}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-4 py-3.5 items-center hover:bg-gray-50 transition-colors group",
                isRed && "bg-red-50/30 hover:bg-red-50/60"
              )}
            >
              {/* Nombre */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                    isRed
                      ? "bg-red-100 text-red-700"
                      : isYellow
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-50 text-blue-600"
                  )}
                >
                  {cliente.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {cliente.nombre}
                  </p>
                  <p className="text-xs text-gray-400">{cliente.cuit_cuil}</p>
                </div>
              </div>

              {/* Condición fiscal */}
              <span className="text-xs text-gray-500">
                {condicionFiscalLabel(cliente.condicion_fiscal)}
              </span>

              {/* Próximo vencimiento */}
              <div>
                {cliente.dias_para_vencer !== null ? (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      cliente.dias_para_vencer <= 3
                        ? "text-red-600"
                        : cliente.dias_para_vencer <= 7
                        ? "text-amber-600"
                        : "text-gray-600"
                    )}
                  >
                    {diasRestantesLabel(cliente.dias_para_vencer)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>

              {/* Última actividad */}
              <span className="text-xs text-gray-400">
                {formatFechaRelativa(cliente.ultima_actividad)}
              </span>

              {/* Estado */}
              <div className="flex items-center gap-2">
                <RiskBadge nivel={cliente.estado_alerta} />
                {cliente.tareas_pendientes > 0 && (
                  <span className="text-xs text-gray-400">
                    {cliente.tareas_pendientes}t
                  </span>
                )}
              </div>

              {/* Arrow */}
              <div className="flex justify-end">
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
