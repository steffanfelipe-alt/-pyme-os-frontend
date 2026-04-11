export interface DashboardResponse {
  bloque_riesgo: BloqueRiesgo;
  bloque_carga: BloqueCarga;
  bloque_salud: BloqueSalud;
  generado_en: string;
  filtrado_por_contador: number | null;
}

export interface BloqueRiesgo {
  vencimientos_sin_docs: VencimientoSinDoc[];
  clientes_sin_actividad: ClienteSinActividad[];
  tareas_retrasadas: TareaRetrasada[];
  alertas_activas: {
    criticas: number;
    advertencias: number;
    informativas: number;
  };
}

export interface VencimientoSinDoc {
  cliente_id: number;
  cliente_nombre: string;
  tipo: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  urgencia: "CRITICO" | "URGENTE" | "PROXIMO";
  contador_nombre: string | null;
}

export interface ClienteSinActividad {
  cliente_id: number;
  nombre: string;
  ultima_actividad: string | null;
  dias_inactivo: number;
  contador_nombre: string | null;
}

export interface TareaRetrasada {
  tarea_id: number;
  titulo: string;
  cliente_nombre: string;
  contador_nombre: string | null;
  dias_retraso: number;
}

export interface BloqueCarga {
  carga_por_contador: CargaContador[];
  completadas_a_tiempo: {
    total_pct: number;
    mes_anterior_pct: number | null;
  };
  tiempo_promedio_resolucion: Array<{
    tipo: string;
    promedio_horas: number;
    cantidad: number;
  }>;
  indice_concentracion: {
    alerta: boolean;
    top_contador_pct: number;
    mensaje: string | null;
  };
}

export interface CargaContador {
  empleado_id: number;
  nombre: string;
  rol: string;
  horas_comprometidas: number;
  horas_disponibles: number;
  porcentaje_carga: number;
  nivel: string;
  cantidad_tareas: number;
  color: "verde" | "amarillo" | "rojo";
}

export interface BloqueSalud {
  tiempo_real_por_cliente: Array<{
    cliente_id: number;
    nombre: string;
    horas_mes: number;
  }>;
  documentacion_por_cliente: Array<{
    cliente_id: number;
    nombre: string;
    vencimientos_total: number;
    con_documentacion: number;
    pct: number;
  }>;
  evolucion_clientes: Array<{
    mes: string;
    activos: number;
    altas: number;
    bajas: number;
  }>;
  rentabilidad_por_cliente: Array<{
    cliente_id: number;
    nombre: string;
    honorarios: number | null;
    horas_mes: number;
    costo_hora_estimado: number | null;
    semaforo: "rentable" | "neutro" | "deficitario" | "sin_datos";
  }>;
}
