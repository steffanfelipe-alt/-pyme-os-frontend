"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, Users } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { ClienteTable } from "@/components/clientes/ClienteTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
import type { EstadoAlerta } from "@/types/cliente";
import { cn } from "@/lib/utils";

const FILTROS: { label: string; value: EstadoAlerta | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "En riesgo", value: "rojo" },
  { label: "En observación", value: "amarillo" },
  { label: "Al día", value: "verde" },
  { label: "Sin datos", value: "sin_datos" },
];

export default function ClientesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroAlerta, setFiltroAlerta] = useState<EstadoAlerta | "todos">("todos");

  const { clientes, loading, error, refetch } = useClientes({
    busqueda: busqueda || undefined,
    estado_alerta: filtroAlerta === "todos" ? undefined : filtroAlerta,
  });

  const stats = useMemo(() => ({
    total: clientes.length,
    rojo: clientes.filter((c) => c.estado_alerta === "rojo").length,
    amarillo: clientes.filter((c) => c.estado_alerta === "amarillo").length,
    verde: clientes.filter((c) => c.estado_alerta === "verde").length,
  }), [clientes]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description={`${stats.total} clientes activos`}
        actions={
          <Link
            href="/clientes/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Link>
        }
      />

      {/* Mini métricas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "En riesgo", count: stats.rojo, color: "text-red-600", bg: "bg-red-50 border-red-100", filter: "rojo" },
          { label: "En observación", count: stats.amarillo, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", filter: "amarillo" },
          { label: "Al día", count: stats.verde, color: "text-green-600", bg: "bg-green-50 border-green-100", filter: "verde" },
        ].map(({ label, count, color, bg, filter }) => (
          <button
            key={label}
            onClick={() => setFiltroAlerta(filtroAlerta === filter ? "todos" : filter as EstadoAlerta)}
            className={cn("rounded-lg border px-4 py-3 text-left transition-all", bg,
              filtroAlerta === filter && "ring-2 ring-offset-1 ring-blue-300"
            )}
          >
            <p className={cn("text-xl font-bold", color)}>{count}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre o CUIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="text-sm text-gray-600 placeholder:text-gray-400 outline-none flex-1 bg-transparent"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {FILTROS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFiltroAlerta(value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                filtroAlerta === value ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Contenido */}
      {loading ? (
        <LoadingTable rows={8} />
      ) : error ? (
        <div className="text-center py-10 text-red-500 text-sm">{error}</div>
      ) : clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay clientes"
          description={
            busqueda
              ? `No se encontraron resultados para "${busqueda}"`
              : "Todavía no tenés clientes cargados en el sistema"
          }
          action={
            !busqueda ? (
              <Link href="/clientes/nuevo" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Agregar primer cliente →
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ClienteTable clientes={clientes} />
      )}
    </div>
  );
}
