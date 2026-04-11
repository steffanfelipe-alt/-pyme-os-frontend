"use client";

import { useState, useEffect } from "react";
import { dashboardApi } from "@/lib/api";
import type { DashboardResponse } from "@/types/dashboard";

export function useDashboard(contador_id?: number) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    dashboardApi
      .get(contador_id)
      .then(setData)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Error al cargar dashboard"
        )
      )
      .finally(() => setLoading(false));
  }, [contador_id]);

  return { data, loading, error };
}
