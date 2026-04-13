"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarClock, Plus, Search, Check, ClipboardList } from "lucide-react";
import { vencimientosApi, type Vencimiento } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  formatFecha, diasRestantesLabel, tipoVencimientoLabel, cn,
} from "@/lib/utils";

const ESTADOS = ["todos", "pendiente", "cumplido", "vencido"];
const TIPOS = ["todos", "iva", "monotributo", "ddjj_anual", "iibb", "ganancias", "bienes_personales", "autonomos", "sueldos_cargas", "otro"];

export default function VencimientosPage() {
  const toast = useToast();
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [cumpliendo, setCumpliendo] = useState<number | null>(null);
  const [creandoTarea, setCreandoTarea] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vencimientosApi.listar({
        estado: filtroEstado === "todos" ? undefined : filtroEstado,
        limit: 200,
      });
      setVencimientos(data);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCumplir = async (id: number) => {
    setCumpliendo(id);
    await vencimientosApi.cumplir(id).catch(() => {});
    await cargar();
    setCumpliendo(null);
  };

  const handleCrearTarea = async (id: number) => {
    setCreandoTarea(id);
    try {
      const t = await vencimientosApi.crearTarea(id);
      toast.success(`Tarea creada: "${t.titulo}" (prioridad: ${t.prioridad})`);
    } catch (e: any) {
      toast.error(e.message ?? "Error al crear tarea");
    } finally {
      setCreandoTarea(null);
    }
  };

  const filtrados = vencimientos.filter((v) => {
    if (filtroTipo !== "todos" && v.tipo !== filtroTipo) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return (
        v.descripcion.toLowerCase().includes(q) ||
        (v.cliente_nombre ?? "").toLowerCase().includes(q) ||
        tipoVencimientoLabel(v.tipo).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const urgentes = filtrados.filter(
    (v) => v.estado === "pendiente" && (v.dias_para_vencer ?? 999) <= 7
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vencimientos"
        description={`${filtrados.length} vencimientos`}
      />

      {/* Urgentes */}
      {urgentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">
            {urgentes.length} vencimiento{urgentes.length > 1 ? "s" : ""} urgente{urgentes.length > 1 ? "s" : ""} (próximos 7 días)
          </p>
          <div className="space-y-1.5">
            {urgentes.slice(0, 3).map((v) => (
              <div key={v.id} className="flex items-center justify-between text-sm">
                <span className="text-red-700 font-medium">{v.cliente_nombre ?? `Cliente #${v.cliente_id}`}</span>
                <span className="text-red-500">
                  {tipoVencimientoLabel(v.tipo)} · {diasRestantesLabel(v.dias_para_vencer ?? null)}
                </span>
              </div>
            ))}
            {urgentes.length > 3 && (
              <p className="text-xs text-red-500">+{urgentes.length - 3} más</p>
            )}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por cliente o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="text-sm outline-none flex-1 bg-transparent placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {ESTADOS.map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                filtroEstado === e ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {e === "todos" ? "Todos" : e}
            </button>
          ))}
        </div>

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
        >
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t === "todos" ? "Todos los tipos" : tipoVencimientoLabel(t)}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <LoadingTable rows={8} />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sin vencimientos"
          description="No hay vencimientos con los filtros seleccionados"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
            {["Cliente / Descripción", "Tipo", "Vencimiento", "Estado", ""].map((h) => (
              <span key={h} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {filtrados.map((v) => {
              const dias = v.dias_para_vencer ?? null;
              const vencida = v.estado !== "cumplido" && (v.estado === "vencido" || (dias !== null && dias < 0));
              const urgente = !vencida && dias !== null && dias <= 3;
              const proximo = !vencida && !urgente && dias !== null && dias <= 7;

              return (
                <div
                  key={v.id}
                  className={cn(
                    "grid grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3.5 items-center",
                    vencida && "bg-red-50/40",
                    urgente && "bg-red-50/20"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {v.cliente_nombre ?? `Cliente #${v.cliente_id}`}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{v.descripcion}</p>
                  </div>

                  <span className="text-xs text-gray-600 font-medium">
                    {tipoVencimientoLabel(v.tipo)}
                  </span>

                  <div>
                    <p className="text-xs text-gray-700">{formatFecha(v.fecha_vencimiento)}</p>
                    {dias !== null && v.estado === "pendiente" && (
                      <p className={cn(
                        "text-[10px] font-medium mt-0.5",
                        vencida || dias < 0 ? "text-red-600" :
                        urgente ? "text-red-500" :
                        proximo ? "text-amber-600" : "text-gray-400"
                      )}>
                        {diasRestantesLabel(dias)}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      v.estado === "cumplido" ? "bg-green-100 text-green-700" :
                      vencida ? "bg-red-100 text-red-700" :
                      urgente ? "bg-red-50 text-red-600 border border-red-200" :
                      proximo ? "bg-amber-50 text-amber-600 border border-amber-200" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {v.estado === "cumplido" ? "Cumplido" :
                       vencida ? "Vencido" :
                       urgente ? "Urgente" :
                       proximo ? "Próximo" : "Pendiente"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-1">
                    {v.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => handleCrearTarea(v.id)}
                          disabled={creandoTarea === v.id}
                          className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          title="Crear tarea automática"
                        >
                          <ClipboardList className="h-3 w-3" />
                          {creandoTarea === v.id ? "..." : "Crear tarea"}
                        </button>
                        <button
                          onClick={() => handleCumplir(v.id)}
                          disabled={cumpliendo === v.id}
                          className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          {cumpliendo === v.id ? "..." : "Cumplido"}
                        </button>
                      </>
                    )}
                    {v.estado === "cumplido" && (
                      <span className="text-xs text-gray-400">{formatFecha(v.fecha_cumplimiento)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
