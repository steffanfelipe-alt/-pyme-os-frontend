"use client";

import { useState, useEffect, useCallback } from "react";
import { clientesApi } from "@/lib/api";
import type { ClienteResumen, EstadoAlerta } from "@/types/cliente";

interface UseClientesOptions {
  activo?: boolean;
  estado_alerta?: EstadoAlerta;
  busqueda?: string;
  contador_asignado_id?: number;
}

export function useClientes(options: UseClientesOptions = {}) {
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientesApi.listar({
        activo: options.activo ?? true,
        estado_alerta: options.estado_alerta,
        busqueda: options.busqueda || undefined,
        contador_asignado_id: options.contador_asignado_id,
        limit: 200,
      });
      setClientes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, [
    options.activo,
    options.estado_alerta,
    options.busqueda,
    options.contador_asignado_id,
  ]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { clientes, loading, error, refetch };
}
