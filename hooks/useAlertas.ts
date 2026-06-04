"use client";

import { useState, useEffect, useCallback } from "react";
import { alertasApi } from "@/lib/api";
import type { Alerta, ResumenAlertas } from "@/types/alerta";

export function useAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [resumen, setResumen] = useState<ResumenAlertas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, r] = await Promise.all([
        alertasApi.listar(),
        alertasApi.resumen(),
      ]);
      setAlertas(a);
      setResumen(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar alertas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const resolver = useCallback(
    async (id: number) => {
      await alertasApi.resolver(id);
      await refetch();
    },
    [refetch]
  );

  const marcarVista = useCallback(
    async (id: number) => {
      await alertasApi.marcarVista(id);
      setAlertas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, vista: true } : a))
      );
    },
    []
  );

  return { alertas, resumen, loading, error, resolver, marcarVista, refetch };
}
