"use client";

import { useState } from "react";
import { Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Alerta {
  id: number;
  tipo: string;
  origen: string;
  titulo?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  nivel: string;
  severidad: string;
  mensaje: string;
  estado: "activa" | "resuelta" | "ignorada";
  canal?: string;
  created_at?: string;
}

const NIVEL_CONFIG = {
  critica: "border-l-red-500 bg-red-50",
  advertencia: "border-l-yellow-500 bg-yellow-50",
  informativa: "border-l-blue-500 bg-blue-50",
};

const NIVEL_BADGE = {
  critica: "bg-red-100 text-red-700",
  advertencia: "bg-yellow-100 text-yellow-700",
  informativa: "bg-blue-100 text-blue-700",
};

interface Props {
  alerta: Alerta;
  onResolver?: (id: number) => Promise<void>;
  onIgnorar?: (id: number) => Promise<void>;
  showClienteLink?: boolean;
}

export function AlertaCard({ alerta, onResolver, onIgnorar, showClienteLink = true }: Props) {
  const [loading, setLoading] = useState<"resolver" | "ignorar" | null>(null);

  const handleResolver = async () => {
    if (!onResolver || loading) return;
    setLoading("resolver");
    try {
      await onResolver(alerta.id);
    } finally {
      setLoading(null);
    }
  };

  const handleIgnorar = async () => {
    if (!onIgnorar || loading) return;
    setLoading("ignorar");
    try {
      await onIgnorar(alerta.id);
    } finally {
      setLoading(null);
    }
  };

  const nivelClass = NIVEL_CONFIG[alerta.nivel as keyof typeof NIVEL_CONFIG] ?? NIVEL_CONFIG.informativa;
  const badgeClass = NIVEL_BADGE[alerta.nivel as keyof typeof NIVEL_BADGE] ?? NIVEL_BADGE.informativa;

  return (
    <div className={cn("border-l-4 rounded-r-lg p-4 flex gap-3", nivelClass)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap mb-1">
          {alerta.titulo && (
            <span className="font-semibold text-gray-900 text-sm">{alerta.titulo}</span>
          )}
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", badgeClass)}>
            {alerta.nivel}
          </span>
          {alerta.tipo === "manual" && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              Manual
            </span>
          )}
        </div>
        {alerta.cliente_nombre && showClienteLink && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <User className="w-3 h-3" />
            <a href={`/clientes/${alerta.cliente_id}`} className="hover:underline">
              {alerta.cliente_nombre}
            </a>
          </div>
        )}
        <p className="text-sm text-gray-700">{alerta.mensaje}</p>
        {alerta.created_at && (
          <p className="text-xs text-gray-400 mt-1">
            {new Date(alerta.created_at).toLocaleDateString("es-AR")}
          </p>
        )}
      </div>
      {alerta.estado === "activa" && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleResolver}
            disabled={loading !== null}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3 h-3" />
            {loading === "resolver" ? "..." : "Resolver"}
          </button>
          <button
            onClick={handleIgnorar}
            disabled={loading !== null}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <X className="w-3 h-3" />
            {loading === "ignorar" ? "..." : "Ignorar"}
          </button>
        </div>
      )}
    </div>
  );
}
