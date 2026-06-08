"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardApi } from "@/lib/api";
import type { DashboardResponse } from "@/types/dashboard";

export function useDashboard(contador_id?: number) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardApi
      .get(contador_id)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error al cargar dashboard"
        )
      )
      .finally(() => setLoading(false));
  }, [contador_id, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, refetch };
}
