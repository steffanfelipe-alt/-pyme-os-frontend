"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CheckSquare, Play, CheckCheck, Clock, Search, Plus, X } from "lucide-react";
import { tareasApi, clientesApi, empleadosApi } from "@/lib/api";
import type { Tarea } from "@/types/tarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatFecha, estadoTareaLabel, prioridadLabel, cn } from "@/lib/utils";

const ESTADOS_FILTRO = ["todos", "pendiente", "en_progreso", "completada"];
const PRIORIDADES_FILTRO = ["todas", "urgente", "alta", "normal", "baja"];

const PRIORIDAD_COLOR: Record<string, string> = {
  urgente: "bg-red-100 text-red-700",
  alta: "bg-amber-100 text-amber-700",
  normal: "bg-gray-100 text-gray-600",
  baja: "bg-blue-50 text-blue-500",
};

const ESTADO_DOT: Record<string, string> = {
  pendiente: "bg-gray-400",
  en_progreso: "bg-blue-500",
  completada: "bg-green-500",
  cancelada: "bg-red-400",
};

const TIPOS_TAREA = ["declaracion", "conciliacion", "auditoria", "asesoramiento", "otro", "tarea", "requerimiento"];

interface NuevaTareaForm {
  titulo: string;
  tipo: string;
  prioridad: string;
  cliente_id: string;
  empleado_id: string;
  fecha_limite: string;
  horas_estimadas: string;
}

const FORM_INICIAL: NuevaTareaForm = {
  titulo: "",
  tipo: "otro",
  prioridad: "normal",
  cliente_id: "",
  empleado_id: "",
  fecha_limite: "",
  horas_estimadas: "",
};

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NuevaTareaForm>(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([]);
  const [empleados, setEmpleados] = useState<{ id: number; nombre: string }[]>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const data = await tareasApi.listar({
        estado: filtroEstado === "todos" ? undefined : filtroEstado,
        prioridad: filtroPrioridad === "todas" ? undefined : filtroPrioridad,
        limit: 200,
      });
      setTareas(data);
    } catch (err: any) {
      setErrorCarga(err.message ?? "Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, filtroPrioridad]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirModal = async () => {
    setForm(FORM_INICIAL);
    setModalOpen(true);
    try {
      const [c, e] = await Promise.all([clientesApi.listar({ limit: 500 }), empleadosApi.listar()]);
      setClientes(c.map((x: any) => ({ id: x.id, nombre: x.nombre })));
      setEmpleados(e.map((x: any) => ({ id: x.id, nombre: x.nombre })));
    } catch {}
  };

  const handleGuardar = async () => {
    if (!form.titulo.trim()) return;
    setGuardando(true);
    try {
      await tareasApi.crear({
        titulo: form.titulo,
        tipo: form.tipo as any,
        prioridad: form.prioridad as any,
        cliente_id: form.cliente_id ? Number(form.cliente_id) : undefined,
        empleado_id: form.empleado_id ? Number(form.empleado_id) : undefined,
        fecha_limite: form.fecha_limite || undefined,
        horas_estimadas: form.horas_estimadas ? Number(form.horas_estimadas) : undefined,
      } as any);
      setModalOpen(false);
      await cargar();
    } catch (e: any) {
      alert(e.message ?? "Error al crear la tarea");
    } finally {
      setGuardando(false);
    }
  };

  const handleIniciar = async (id: number) => {
    setActionId(id);
    await tareasApi.iniciar(id).catch(() => {});
    await cargar();
    setActionId(null);
  };

  const handleCompletar = async (id: number) => {
    setActionId(id);
    await tareasApi.completar(id).catch(() => {});
    await cargar();
    setActionId(null);
  };

  const filtradas = tareas.filter((t) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      t.titulo.toLowerCase().includes(q) ||
      (t.cliente_nombre ?? "").toLowerCase().includes(q)
    );
  });

  const retrasadas = filtradas.filter(
    (t) =>
      t.fecha_limite &&
      new Date(t.fecha_limite) < new Date() &&
      t.estado !== "completada" &&
      t.estado !== "cancelada"
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tareas"
          description={`${filtradas.length} tareas · ${retrasadas.length} retrasadas`}
        />
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </div>

      {/* Banner retrasadas */}
      {retrasadas.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">
              {retrasadas.length} tarea{retrasadas.length > 1 ? "s" : ""} retrasada{retrasadas.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-red-500">
              {retrasadas.slice(0, 3).map((t) => t.titulo).join(", ")}
              {retrasadas.length > 3 && ` y ${retrasadas.length - 3} más`}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar tarea o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="text-sm outline-none flex-1 bg-transparent placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {ESTADOS_FILTRO.map((e) => (
            <button
              key={e}
              onClick={() => setFiltroEstado(e)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                filtroEstado === e ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {e === "todos" ? "Todos" : estadoTareaLabel(e)}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {PRIORIDADES_FILTRO.map((p) => (
            <button
              key={p}
              onClick={() => setFiltroPrioridad(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                filtroPrioridad === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              {p === "todas" ? "Todas" : prioridadLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <LoadingTable rows={8} />
      ) : errorCarga ? (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <CheckSquare className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">Error al cargar las tareas</p>
            <p className="text-xs text-red-500">{errorCarga}</p>
          </div>
          <button
            onClick={() => cargar()}
            className="ml-auto text-xs text-red-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Sin tareas"
          description="No hay tareas con los filtros seleccionados"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_140px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
            {["Tarea", "Cliente", "Prioridad", "Límite", "Acciones"].map((h) => (
              <span key={h} className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-gray-50">
            {filtradas.map((t) => {
              const retrasada =
                t.fecha_limite &&
                new Date(t.fecha_limite) < new Date() &&
                t.estado !== "completada";
              const isActing = actionId === t.id;

              return (
                <div
                  key={t.id}
                  className={cn(
                    "grid grid-cols-[2fr_1fr_1fr_1fr_140px] gap-4 px-4 py-3.5 items-center",
                    retrasada && "bg-red-50/30",
                    t.estado === "completada" && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", ESTADO_DOT[t.estado] ?? "bg-gray-300")} />
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium text-gray-800 truncate", t.estado === "completada" && "line-through text-gray-400")}>
                        {t.titulo}
                      </p>
                      {t.horas_estimadas && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {t.horas_estimadas}h estimadas
                          {t.horas_reales ? ` · ${t.horas_reales}h reales` : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {t.cliente_id ? (
                    <Link
                      href={`/clientes/${t.cliente_id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 truncate font-medium"
                    >
                      {t.cliente_nombre ?? `#${t.cliente_id}`}
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}

                  <span className={cn(
                    "inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    PRIORIDAD_COLOR[t.prioridad] ?? "bg-gray-100 text-gray-600"
                  )}>
                    {prioridadLabel(t.prioridad)}
                  </span>

                  <div>
                    {t.fecha_limite ? (
                      <>
                        <p className={cn("text-xs", retrasada ? "text-red-600 font-semibold" : "text-gray-600")}>
                          {formatFecha(t.fecha_limite)}
                        </p>
                        {retrasada && <p className="text-[10px] text-red-500">Retrasada</p>}
                      </>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {t.estado === "pendiente" && (
                      <button
                        onClick={() => handleIniciar(t.id)}
                        disabled={isActing}
                        className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Play className="h-3 w-3" />
                        Iniciar
                      </button>
                    )}
                    {(t.estado === "pendiente" || t.estado === "en_progreso") && (
                      <button
                        onClick={() => handleCompletar(t.id)}
                        disabled={isActing}
                        className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Hecho
                      </button>
                    )}
                    {t.estado === "completada" && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCheck className="h-3.5 w-3.5" /> Completada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modal Nueva Tarea ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Nueva tarea</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Presentación IVA junio"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tipo */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                  >
                    {TIPOS_TAREA.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={form.prioridad}
                    onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                  >
                    {["urgente", "alta", "normal", "baja"].map((p) => (
                      <option key={p} value={p}>{prioridadLabel(p)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">Sin cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Empleado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Asignar a</label>
                <select
                  value={form.empleado_id}
                  onChange={(e) => setForm({ ...form, empleado_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="">Sin asignar</option>
                  {empleados.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Fecha límite */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha límite</label>
                  <input
                    type="date"
                    value={form.fecha_limite}
                    onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>

                {/* Horas estimadas */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Horas estimadas</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.horas_estimadas}
                    onChange={(e) => setForm({ ...form, horas_estimadas: e.target.value })}
                    placeholder="Ej: 2.5"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={!form.titulo.trim() || guardando}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Crear tarea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
