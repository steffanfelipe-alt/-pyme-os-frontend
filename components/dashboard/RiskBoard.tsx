"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ClienteSinActividad } from "@/types/dashboard";

interface RiskBoardProps {
  clientes: ClienteSinActividad[];
}

export function RiskBoard({ clientes }: RiskBoardProps) {
  if (clientes.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-4 text-center">
        Todos los clientes tienen actividad reciente
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {clientes.slice(0, 6).map((cliente) => (
        <Link
          key={cliente.cliente_id}
          href={`/clientes/${cliente.cliente_id}`}
          className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 group transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
            {cliente.nombre.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{cliente.nombre}</p>
            <p className="text-xs text-gray-400">
              Sin actividad hace{" "}
              <span className="font-medium text-amber-600">{cliente.dias_inactivo}d</span>
              {cliente.contador_nombre && ` · ${cliente.contador_nombre}`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-gray-400 transition-colors shrink-0" />
        </Link>
      ))}
      {clientes.length > 6 && (
        <Link
          href="/clientes?estado_alerta=rojo"
          className="block text-center text-xs text-blue-600 hover:text-blue-700 pt-2 font-medium"
        >
          Ver {clientes.length - 6} más →
        </Link>
      )}
    </div>
  );
}
