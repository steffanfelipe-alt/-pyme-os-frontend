// ─── Template (proceso base) ──────────────────────────────────────────────────

export interface PasoProceso {
  id: number;
  template_id: number;
  orden: number;
  // Backend uses "titulo"; keep "nombre" as alias so existing code doesn't break
  titulo: string;
  nombre?: string;  // alias — populated from titulo
  descripcion: string | null;
  tiempo_estimado_minutos: number | null;
  es_automatizable: boolean;
  obligatorio?: boolean;  // not in backend schema, kept for UI use
}

export interface Proceso {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  activo: boolean;
  sop_url?: string | null;
  sop_generado?: boolean;
  pasos?: PasoProceso[];
}

// ─── Instancia (proceso en ejecución) ────────────────────────────────────────

export interface InstanciaPaso {
  id: number;
  instancia_id: number;
  paso_template_id: number;
  orden: number;
  estado: "pendiente" | "completado" | "saltado";
  fecha_inicio: string | null;
  fecha_fin: string | null;
  tiempo_real_minutos: number | null;
  notas: string | null;
  asignado_a: number | null;
  guia_sop?: string | null;
}

export interface InstanciaProceso {
  id: number;
  template_id: number;
  /** @deprecated use template_id */
  proceso_id?: number;
  cliente_id: number | null;
  vencimiento_id?: number | null;
  estado: string;
  progreso_pct: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  pasos: InstanciaPaso[];
  sop_vinculado?: any;
  // Computed helpers (not from backend — derive from pasos)
  proceso_nombre?: string;
  cliente_nombre?: string;
  pasos_completados?: number;
  pasos_total?: number;
}
