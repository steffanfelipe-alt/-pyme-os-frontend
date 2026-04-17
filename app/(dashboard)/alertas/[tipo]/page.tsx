"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AlertaCard, type Alerta } from "@/components/alertas/AlertaCard";
import { AlertaManualModal } from "@/components/alertas/AlertaManualModal";

const TIPO_LABELS: Record<string, string> = {
  vencimiento: "Vencimientos",
  mora: "Mora en cobranza",
  riesgo: "Score de riesgo alto",
  tarea_vencida: "Tareas vencidas",
  documentacion: "Documentación pendiente",
  manual: "Alertas manuales",
};

interface Cliente {
  id: number;
  nombre: string;
}

export default function AlertasTipoPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const router = useRouter();

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { tipo };
      if (filtroCliente) params.cliente_id = filtroCliente;
      const qs = new URLSearchParams(params).toString();
      const data = await apiFetch<Alerta[]>(`/alertas?${qs}`) as Alerta[];
      setAlertas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tipo, filtroCliente]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    apiFetch<Cliente[]>("/api/clientes?limit=200").then(data => {
      setClientes(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const handleResolver = async (id: number) => {
    await apiFetch(`/alertas/${id}/resolver`, { method: "PATCH" });
    setAlertas(prev => prev.filter(a => a.id !== id));
  };

  const handleIgnorar = async (id: number) => {
    await apiFetch(`/alertas/${id}/ignorar`, { method: "PATCH" });
    setAlertas(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/alertas")}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {TIPO_LABELS[tipo] ?? tipo}
          </h1>
          <p className="text-sm text-gray-500">{alertas.length} alerta{alertas.length !== 1 ? "s" : ""} activa{alertas.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva alerta manual
        </button>
      </div>

      {/* Filtro por cliente */}
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <select
          value={filtroCliente}
          onChange={e => setFiltroCliente(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los clientes</option>
          {clientes.map(c => (
            <option key={c.id} value={String(c.id)}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : alertas.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-medium text-gray-500">No hay alertas de este tipo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map(alerta => (
            <AlertaCard
              key={alerta.id}
              alerta={alerta}
              onResolver={handleResolver}
              onIgnorar={handleIgnorar}
            />
          ))}
        </div>
      )}

      <AlertaManualModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onSuccess={cargar}
      />
    </div>
  );
}
