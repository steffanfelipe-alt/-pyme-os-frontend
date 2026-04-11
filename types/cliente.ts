export type TipoPersona = "fisica" | "juridica";

export type CondicionFiscal =
  | "responsable_inscripto"
  | "monotributista"
  | "exento"
  | "no_responsable"
  | "relacion_de_dependencia"
  | "autonomos"
  | "sujeto_no_categorizado";

export type EstadoAlerta = "verde" | "amarillo" | "rojo" | "sin_datos";

export type RiskLevel = "verde" | "amarillo" | "rojo" | null;

export interface ClienteResumen {
  id: number;
  tipo_persona: TipoPersona;
  nombre: string;
  cuit_cuil: string;
  condicion_fiscal: CondicionFiscal;
  contador_asignado_id: number | null;
  activo: boolean;
  proximo_vencimiento: string | null;
  tareas_pendientes: number;
  ultima_actividad: string | null;
  estado_alerta: EstadoAlerta;
  dias_para_vencer: number | null;
}

export interface ClienteDetalle {
  id: number;
  tipo_persona: TipoPersona;
  nombre: string;
  cuit_cuil: string;
  email: string | null;
  telefono: string | null;
  telefono_whatsapp: string | null;
  email_notificaciones: string | null;
  acepta_notificaciones: boolean;
  condicion_fiscal: CondicionFiscal;
  contador_asignado_id: number | null;
  notas: string | null;
  plantilla_aplicada: boolean;
  honorarios_mensuales: number | null;
  satisfaccion: number | null;
  activo: boolean;
  risk_score: number | null;
  risk_level: RiskLevel;
  risk_explanation: string | null;
  created_at: string;
  updated_at: string;
}

export interface FichaCliente {
  cliente: ClienteDetalle;
  contador_principal: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  } | null;
  participantes_tareas: Array<{
    id: number;
    nombre: string;
    email: string;
    rol: string;
  }>;
  vencimientos: {
    proximos: VencimientoFicha[];
    vencidos: VencimientoFicha[];
  };
  tareas: {
    activas: TareaFicha[];
    completadas_recientes: TareaFicha[];
  };
  estado_alerta: EstadoAlerta;
  documentos: DocumentoResumen[];
}

export interface VencimientoFicha {
  id: number;
  tipo: string;
  descripcion: string;
  fecha_vencimiento: string;
  fecha_cumplimiento: string | null;
  estado: string;
  dias_para_vencer: number;
}

export interface TareaFicha {
  id: number;
  titulo: string;
  tipo: string;
  prioridad: string;
  estado: string;
  fecha_limite: string | null;
  horas_estimadas: number | null;
  empleado_id: number | null;
}

export interface DocumentoResumen {
  id: number;
  nombre_original: string;
  tipo_documento: string;
  estado: string;
  created_at: string;
}

export interface ClienteCreate {
  tipo_persona: TipoPersona;
  nombre: string;
  cuit_cuil: string;
  condicion_fiscal: CondicionFiscal;
  email?: string;
  telefono?: string;
  telefono_whatsapp?: string;
  notas?: string;
  contador_asignado_id?: number;
  honorarios_mensuales?: number;
}
