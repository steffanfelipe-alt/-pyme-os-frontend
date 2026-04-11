export type TareaPrioridad = "baja" | "normal" | "alta" | "urgente";
export type TareaEstado = "pendiente" | "en_progreso" | "completada" | "cancelada";

export interface Tarea {
  id: number;
  cliente_id: number;
  cliente_nombre?: string;
  titulo: string;
  tipo: string;
  descripcion: string | null;
  prioridad: TareaPrioridad;
  estado: TareaEstado;
  fecha_limite: string | null;
  horas_estimadas: number | null;
  horas_reales: number | null;
  empleado_id: number | null;
  empleado_nombre?: string;
  created_at: string;
  updated_at: string;
}

export interface TareaCreate {
  cliente_id?: number;
  titulo: string;
  tipo: string;
  descripcion?: string;
  prioridad?: TareaPrioridad;
  fecha_limite?: string;
  horas_estimadas?: number;
  empleado_id?: number;
}
