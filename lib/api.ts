const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
  // Cookie leída por el middleware SSR (no HttpOnly para que JS pueda limpiarla)
  document.cookie = `access_token=${token}; path=/; samesite=lax`;
}

export function clearToken(): void {
  localStorage.removeItem("access_token");
  document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = getToken();
  const { params, ...fetchOptions } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  }).catch((err: unknown) => {
    if (err instanceof TypeError) {
      throw new Error("No se pudo conectar al servidor. Verificá que el backend esté corriendo.");
    }
    throw err;
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("No autorizado");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Error desconocido" }));
    const detail = error.detail ?? `HTTP ${res.status}`;
    // Token emitido antes del refactor de studio_id — tratar como sesión inválida
    if (
      res.status === 400 &&
      typeof detail === "string" &&
      detail.includes("studio_id")
    ) {
      clearToken();
      window.location.href = "/login";
      throw new Error("Sesión inválida, volvé a iniciar sesión");
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; token_type: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, nombre: string) =>
    apiFetch<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, nombre }),
    }),

  setupStatus: () =>
    apiFetch<{ necesita_setup: boolean }>("/api/auth/setup/status"),

  setupEstudio: (data: {
    nombre_estudio: string;
    nombre_dueno: string;
    email: string;
    password: string;
  }) =>
    apiFetch<{ access_token: string }>("/api/auth/setup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ detail: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    apiFetch<{ detail: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password }),
    }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

import type { DashboardResponse } from "@/types/dashboard";

export const dashboardApi = {
  get: (contador_id?: number) =>
    apiFetch<DashboardResponse>("/api/dashboard", {
      params: { contador_id },
    }),
};

// ─── Clientes ─────────────────────────────────────────────────────────────────

import type {
  ClienteResumen,
  ClienteDetalle,
  FichaCliente,
  ClienteCreate,
  EstadoAlerta,
} from "@/types/cliente";

export const clientesApi = {
  listar: (params?: {
    skip?: number;
    limit?: number;
    activo?: boolean;
    busqueda?: string;
    estado_alerta?: EstadoAlerta;
    contador_asignado_id?: number;
  }) => apiFetch<ClienteResumen[]>("/api/clientes", { params }),

  obtener: (id: number) =>
    apiFetch<ClienteDetalle>(`/api/clientes/${id}`),

  ficha: (id: number) =>
    apiFetch<FichaCliente>(`/api/clientes/${id}/ficha`),

  crear: (data: ClienteCreate) =>
    apiFetch<ClienteDetalle>("/api/clientes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<ClienteCreate>) =>
    apiFetch<ClienteDetalle>(`/api/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    apiFetch<void>(`/api/clientes/${id}`, { method: "DELETE" }),

  aplicarPlantillas: (id: number) =>
    apiFetch<{ cliente_id: number; vencimientos_generados: number }>(
      `/api/clientes/${id}/aplicar-plantillas`,
      { method: "POST" }
    ),

  importarCsv: (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${BASE_URL}/api/clientes/importar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al importar" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      return res.json();
    });
  },

  calcularRisk: (id: number) =>
    apiFetch<{
      id: number;
      risk_score: number;
      risk_level: string;
      risk_explanation: string | null;
    }>(`/api/risk/clients/${id}/calculate`, { method: "POST" }),
};

// ─── Alertas ──────────────────────────────────────────────────────────────────

import type { Alerta, ResumenAlertas } from "@/types/alerta";

export const alertasApi = {
  listar: (nivel?: string) =>
    apiFetch<Alerta[]>("/api/alerts", { params: { nivel } }),

  resumen: () => apiFetch<ResumenAlertas>("/api/alerts/summary"),

  generar: () =>
    apiFetch<Alerta[]>("/api/alerts/generate", { method: "POST" }),

  marcarVista: (id: number) =>
    apiFetch<{ id: number; vista: boolean }>(`/api/alerts/${id}/mark-seen`, {
      method: "PATCH",
    }),

  resolver: (id: number) =>
    apiFetch<{ id: number; resuelta_at: string }>(`/api/alerts/${id}/resolve`, {
      method: "PATCH",
    }),
};

// ─── Vencimientos ─────────────────────────────────────────────────────────────

export interface Vencimiento {
  id: number;
  cliente_id: number;
  cliente_nombre?: string;
  tipo: string;
  descripcion: string;
  fecha_vencimiento: string;
  fecha_cumplimiento: string | null;
  estado: string;
  notas: string | null;
  dias_para_vencer?: number;
}

export const vencimientosApi = {
  listar: (params?: {
    cliente_id?: number;
    estado?: string;
    tipo?: string;
    skip?: number;
    limit?: number;
  }) => apiFetch<Vencimiento[]>("/api/vencimientos", { params }),

  crear: (data: {
    cliente_id: number;
    tipo: string;
    descripcion: string;
    fecha_vencimiento: string;
    notas?: string;
  }) =>
    apiFetch<Vencimiento>("/api/vencimientos", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Record<string, unknown>) =>
    apiFetch<Vencimiento>(`/api/vencimientos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  cumplir: (id: number) =>
    apiFetch<Vencimiento>(`/api/vencimientos/${id}/cumplir`, {
      method: "PATCH",
    }),

  crearTarea: (id: number) =>
    apiFetch<{ tarea_id: number; titulo: string; prioridad: string }>(
      `/api/vencimientos/${id}/crear-tarea`,
      { method: "POST" }
    ),
};

// ─── Tareas ───────────────────────────────────────────────────────────────────

import type { Tarea, TareaCreate } from "@/types/tarea";
export type { Tarea, TareaCreate };

export const tareasApi = {
  listar: (params?: {
    cliente_id?: number;
    empleado_id?: number;
    estado?: string;
    prioridad?: string;
    skip?: number;
    limit?: number;
  }) => apiFetch<Tarea[]>("/api/tareas", { params }),

  crear: (data: TareaCreate) =>
    apiFetch<Tarea>("/api/tareas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Record<string, unknown>) =>
    apiFetch<Tarea>(`/api/tareas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  completar: (id: number) =>
    apiFetch<Tarea>(`/api/tareas/${id}/completar`, { method: "POST" }),

  iniciar: (id: number) =>
    apiFetch<Tarea>(`/api/tareas/${id}/iniciar`, { method: "POST" }),

  pausar: (id: number) =>
    apiFetch<Tarea>(`/api/tareas/${id}/pausar`, { method: "POST" }),

  registrarTiempo: (id: number, horas: number) =>
    apiFetch<Tarea>(`/api/tareas/${id}/tiempo`, {
      method: "POST",
      body: JSON.stringify({ horas }),
    }),
};

// ─── Onboarding ──────────────────────────────────────────────────────────────

export const onboardingApi = {
  estado: () => apiFetch<any>("/onboarding/estado"),

  completarPaso: (paso: string) =>
    apiFetch<{ ok: boolean; paso_completado: string }>("/onboarding/completar-paso", {
      method: "POST",
      body: JSON.stringify({ paso }),
    }),

  siguientesPasos: () => apiFetch<any>("/onboarding/siguientes-pasos"),

  vencimientosSugeridos: () => apiFetch<any[]>("/onboarding/vencimientos-sugeridos"),

  confirmarSugeridos: (ids: number[]) =>
    apiFetch<{ confirmados: number }>("/onboarding/vencimientos-sugeridos/confirmar", {
      method: "POST",
      body: JSON.stringify(ids),
    }),

  descartarSugerido: (id: number) =>
    apiFetch<{ ok: boolean }>(`/onboarding/vencimientos-sugeridos/${id}`, { method: "DELETE" }),

  importarEmpleados: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<{ importados: number; saltados: number; errores: string[] }>(
      "/onboarding/importar-empleados",
      { method: "POST", body: form, headers: {} }
    );
  },

  importarClientes: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<{ importados: number; saltados: number; vencimientos_sugeridos: number; errores: string[] }>(
      "/onboarding/importar-clientes",
      { method: "POST", body: form, headers: {} }
    );
  },
};

// ─── Reportes ─────────────────────────────────────────────────────────────────

export const reportesApi = {
  resumen: (periodo?: string) =>
    apiFetch<any>("/api/reportes/resumen", { params: { periodo } }),

  carga: (periodo?: string) =>
    apiFetch<any>("/api/reportes/carga", { params: { periodo } }),

  rentabilidad: (periodo?: string) =>
    apiFetch<any>("/api/reportes/rentabilidad", { params: { periodo } }),

  vencimientos: (periodo?: string, estado?: string) =>
    apiFetch<any>("/api/reportes/vencimientos", { params: { periodo, estado } }),

  madurez: () => apiFetch<any>("/api/reportes/madurez"),

  config: () => apiFetch<any>("/api/reportes/config"),

  actualizarConfig: (data: {
    nombre_estudio?: string;
    tarifa_hora_pesos?: number;
    moneda?: string;
  }) =>
    apiFetch<any>("/api/reportes/config", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ─── Empleados ────────────────────────────────────────────────────────────────

export interface Empleado {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

export const empleadosApi = {
  listar: () => apiFetch<Empleado[]>("/api/empleados"),
  carga: () => apiFetch<any[]>("/api/empleados/carga"),
};

// ─── Procesos ─────────────────────────────────────────────────────────────────

import type { Proceso, PasoProceso, InstanciaProceso, InstanciaPaso } from "@/types/proceso";
export type { Proceso, PasoProceso, InstanciaProceso, InstanciaPaso };

export const procesosApi = {
  listar: () => apiFetch<Proceso[]>("/api/procesos/templates"),

  obtener: (id: number) => apiFetch<Proceso>(`/api/procesos/templates/${id}`),

  crearTemplate: (data: { nombre: string; descripcion?: string; tipo: string }) =>
    apiFetch<Proceso>("/api/procesos/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  agregarPaso: (templateId: number, data: { titulo: string; descripcion?: string; orden: number; tiempo_estimado_minutos?: number; es_automatizable?: boolean }) =>
    apiFetch<any>(`/api/procesos/templates/${templateId}/pasos`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  instancias: (params?: { cliente_id?: number; estado?: string }) =>
    apiFetch<InstanciaProceso[]>("/api/procesos/instancias", { params }),

  crearInstancia: (template_id: number, cliente_id: number) =>
    apiFetch<InstanciaProceso>("/api/procesos/instancias", {
      method: "POST",
      body: JSON.stringify({ template_id, cliente_id }),
    }),

  obtenerInstancia: (id: number) =>
    apiFetch<InstanciaProceso>(`/api/procesos/instancias/${id}`),

  avanzarPaso: (_instancia_id: number, paso_id: number) =>
    apiFetch<InstanciaProceso>(
      `/api/procesos/pasos-instancia/${paso_id}`,
      { method: "PUT", body: JSON.stringify({ estado: "completado" }) }
    ),

  // ── Estado instancia ──
  iniciarInstancia: (id: number) =>
    apiFetch<InstanciaProceso>(`/api/procesos/instancias/${id}/iniciar`, { method: "PATCH" }),

  completarInstancia: (id: number) =>
    apiFetch<InstanciaProceso>(`/api/procesos/instancias/${id}/completar`, { method: "PATCH" }),

  cancelarInstancia: (id: number) =>
    apiFetch<InstanciaProceso>(`/api/procesos/instancias/${id}/cancelar`, { method: "PATCH" }),

  // ── IA ──
  optimizarDesdeDescripcion: (descripcion: string) =>
    apiFetch<any>("/api/procesos/optimizar/desde-descripcion", {
      method: "POST",
      body: JSON.stringify({ descripcion }),
    }),

  previsualizarOptimizacion: (templateId: number) =>
    apiFetch<{ original: any; optimizado: any }>(
      `/api/procesos/templates/${templateId}/previsualizar-optimizacion`,
      { method: "POST" }
    ),

  aplicarOptimizacion: (templateId: number, descripcion: string | null, pasos: any[]) =>
    apiFetch<Proceso>(`/api/procesos/templates/${templateId}/aplicar-optimizacion`, {
      method: "POST",
      body: JSON.stringify({ descripcion, pasos }),
    }),

  restaurarVersionAnterior: (templateId: number) =>
    apiFetch<Proceso>(`/api/procesos/templates/${templateId}/restaurar-version-anterior`, {
      method: "POST",
    }),

  analizarAutomatizabilidad: (templateId: number) =>
    apiFetch<any>(`/api/procesos/templates/${templateId}/analizar-automatizabilidad`, {
      method: "POST",
    }),

  generarSop: (templateId: number) =>
    apiFetch<{ sop_url: string; mensaje: string }>(`/api/procesos/templates/${templateId}/sop`, {
      method: "POST",
    }),
};

// ─── Automatizaciones n8n ─────────────────────────────────────────────────────

export const automatizacionesApi = {
  generar: (templateId: number) =>
    apiFetch<any>("/api/automatizaciones/generar", {
      method: "POST",
      body: JSON.stringify({ template_id: templateId }),
    }),

  listar: () => apiFetch<any[]>("/api/automatizaciones"),
  listarPendientes: () => apiFetch<any[]>("/api/automatizaciones/pendientes"),
  obtener: (id: number) => apiFetch<any>(`/api/automatizaciones/${id}`),
  aprobar: (id: number) => apiFetch<any>(`/api/automatizaciones/${id}/aprobar`, { method: "PATCH" }),
  descartar: (id: number, motivo?: string) =>
    apiFetch<any>(`/api/automatizaciones/${id}/descartar`, {
      method: "PATCH",
      body: JSON.stringify({ motivo_descarte: motivo ?? "" }),
    }),
};

// ─── Automatizaciones Python Visual ───────────────────────────────────────────

export interface AutomatizacionPython {
  id: number;
  nombre: string;
  descripcion: string | null;
  creado_por_id: number | null;
  estado: "borrador" | "activo" | "archivado";
  nodos: NodoPython[] | null;
  conexiones: ConexionPython[] | null;
  codigo_generado: string | null;
  inputs_configurados: Record<string, Record<string, string>> | null;
  created_at: string;
  updated_at: string;
}

export interface NodoPython {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  required_inputs: InputRequeridoPython[];
}

export interface ConexionPython {
  from_node: string;
  to_node: string;
  label: string | null;
}

export interface InputRequeridoPython {
  campo: string;
  label: string;
  tipo: string;
  opciones?: string[];
}

export interface InputPendiente {
  node_id: string;
  node_name: string;
  node_type: string;
  campos: InputRequeridoPython[];
}

export const automatizacionesPythonApi = {
  listar: () => apiFetch<AutomatizacionPython[]>("/api/automatizaciones-python/"),

  obtener: (id: number) => apiFetch<AutomatizacionPython>(`/api/automatizaciones-python/${id}`),

  crear: (data: { nombre: string; descripcion?: string }) =>
    apiFetch<AutomatizacionPython>("/api/automatizaciones-python/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generarDesdeDescripcion: (descripcion: string, nombre?: string) =>
    apiFetch<AutomatizacionPython>("/api/automatizaciones-python/desde-descripcion", {
      method: "POST",
      body: JSON.stringify({ descripcion, nombre }),
    }),

  actualizar: (id: number, data: Partial<{ nombre: string; descripcion: string; estado: string; nodos: NodoPython[]; conexiones: ConexionPython[] }>) =>
    apiFetch<AutomatizacionPython>(`/api/automatizaciones-python/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  generarCodigo: (id: number) =>
    apiFetch<AutomatizacionPython>(`/api/automatizaciones-python/${id}/generar-codigo`, {
      method: "POST",
    }),

  obtenerInputsPendientes: (id: number) =>
    apiFetch<InputPendiente[]>(`/api/automatizaciones-python/${id}/inputs-requeridos`),

  configurarInputs: (id: number, inputs: Record<string, Record<string, string>>) =>
    apiFetch<AutomatizacionPython>(`/api/automatizaciones-python/${id}/configurar-inputs`, {
      method: "PATCH",
      body: JSON.stringify({ inputs }),
    }),

  activar: (id: number) =>
    apiFetch<AutomatizacionPython>(`/api/automatizaciones-python/${id}/activar`, {
      method: "PATCH",
    }),
};

// ─── Conocimiento ─────────────────────────────────────────────────────────────

export const conocimientoApi = {
  listarSops: (q?: string, area?: string) =>
    apiFetch<any[]>("/api/conocimiento/sops", { params: { q, area } }),

  obtenerSop: (id: number) => apiFetch<any>(`/api/conocimiento/sops/${id}`),

  listarAutomatizaciones: (q?: string) =>
    apiFetch<any[]>("/api/conocimiento/automatizaciones", { params: { q } }),

  listarAutomatizacionesPython: (q?: string) =>
    apiFetch<any[]>("/api/conocimiento/automatizaciones-python", { params: { q } }),

  buscar: (q: string) =>
    apiFetch<{ query: string; total: number; resultados: any[] }>(
      "/api/conocimiento/buscar",
      { params: { q } }
    ),
};

// ─── Agent (AI Chat) ──────────────────────────────────────────────────────────

// ─── Emails ───────────────────────────────────────────────────────────────────

export interface EmailEntrante {
  id: number;
  remitente: string;
  asunto: string | null;
  categoria: string | null;
  urgencia: string | null;
  resumen: string | null;
  estado: string;
  requiere_respuesta: boolean;
  requiere_revision_manual: boolean;
  motivo_revision: string | null;
  tiene_adjuntos: boolean;
  asignado_a: number | null;
  cliente_id: number | null;
  fecha_recibido: string;
  cuerpo_texto?: string | null;
  borrador_respuesta?: string | null;
  borrador_editado?: string | null;
  borrador_aprobado?: boolean;
  respuesta_enviada_at?: string | null;
  leido_at?: string | null;
}

export const emailsApi = {
  listar: (params?: {
    estado?: string;
    categoria?: string;
    pendiente_aprobacion?: boolean;
    skip?: number;
    limit?: number;
  }) => apiFetch<EmailEntrante[]>("/api/emails", { params }),

  obtener: (id: number) =>
    apiFetch<EmailEntrante>(`/api/emails/${id}`),

  asignar: (id: number, empleado_id: number | null) =>
    apiFetch<{ ok: boolean }>(`/api/emails/${id}/asignar`, {
      method: "PATCH",
      body: JSON.stringify({ empleado_id }),
    }),

  cambiarCategoria: (id: number, categoria: string) =>
    apiFetch<{ ok: boolean }>(`/api/emails/${id}/categoria`, {
      method: "PATCH",
      body: JSON.stringify({ categoria }),
    }),

  archivar: (id: number) =>
    apiFetch<{ ok: boolean }>(`/api/emails/${id}/archivar`, { method: "PATCH" }),

  marcarSpam: (id: number) =>
    apiFetch<{ ok: boolean }>(`/api/emails/${id}/marcar-spam`, { method: "PATCH" }),

  aprobarRespuesta: (id: number) =>
    apiFetch<{ ok: boolean }>(`/api/emails/${id}/aprobar-respuesta`, { method: "POST" }),

  editarYEnviar: (id: number, texto: string) =>
    apiFetch<{ ok: boolean }>(`/api/emails/${id}/editar-respuesta`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),

  responderManual: (id: number, texto: string) =>
    apiFetch<{ ok: boolean }>(`/api/emails/${id}/responder`, {
      method: "POST",
      body: JSON.stringify({ texto }),
    }),

  estadoGmail: () =>
    apiFetch<{ conectado: boolean; gmail_address?: string; watch_expiry?: string }>("/api/emails/config/estado"),

  iniciarOAuthGmail: (redirect_uri: string) =>
    apiFetch<{ auth_url: string }>(`/api/emails/config/conectar?redirect_uri=${encodeURIComponent(redirect_uri)}`, {
      method: "POST",
    }),

  completarOAuthGmail: (code: string, redirect_uri: string, studio_email: string) =>
    apiFetch<{ ok: boolean; gmail_address: string }>(
      `/api/emails/config/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirect_uri)}&studio_email=${encodeURIComponent(studio_email)}`,
      { method: "POST" }
    ),

  desconectarGmail: () =>
    apiFetch<{ ok: boolean }>("/api/emails/config", { method: "DELETE" }),
};

// ─── Facturación ──────────────────────────────────────────────────────────────

export interface Comprobante {
  id: number;
  studio_id: number | null;
  cliente_id: number;
  tipo_comprobante: string;
  punto_venta: number;
  numero_comprobante: number | null;
  cae: string | null;
  fecha_cae_vencimiento: string | null;
  fecha_emision: string;
  concepto: number;
  descripcion_concepto: string | null;
  importe_neto: number;
  importe_iva: number;
  importe_total: number;
  alicuota_iva: number;
  estado: string;
  error_arca: string | null;
  enviada_por_email: boolean;
  enviada_por_telegram: boolean;
  pdf_url: string | null;
  created_at: string;
}

export interface HonorarioRecurrente {
  id: number;
  cliente_id: number;
  descripcion: string;
  importe_neto: number;
  alicuota_iva: number;
  tipo_comprobante: string;
  dia_emision: number;
  activo: boolean;
  ultimo_emitido: string | null;
}

export const facturacionApi = {
  // Comprobantes
  listarComprobantes: (params?: {
    cliente_id?: number;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => apiFetch<Comprobante[]>("/api/facturacion/comprobantes", { params }),

  emitirComprobante: (data: {
    cliente_id: number;
    tipo_comprobante: string;
    concepto?: number;
    descripcion_concepto?: string;
    importe_neto: number;
    alicuota_iva?: number;
    fecha_emision?: string;
  }) =>
    apiFetch<Comprobante>("/api/facturacion/comprobantes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  enviarComprobante: (id: number) =>
    apiFetch<Comprobante>(`/api/facturacion/comprobantes/${id}/enviar`, { method: "POST" }),

  registrarPago: (id: number, data: { fecha_pago?: string; medio_pago?: string; nota?: string }) =>
    apiFetch<any>(`/api/facturacion/comprobantes/${id}/registrar-pago`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  obtenerPdf: (id: number) =>
    apiFetch<{ pdf_url: string }>(`/api/facturacion/comprobantes/${id}/pdf`),

  // Honorarios recurrentes
  listarHonorarios: () =>
    apiFetch<HonorarioRecurrente[]>("/api/facturacion/honorarios"),

  crearHonorario: (data: Partial<HonorarioRecurrente> & { cliente_id: number; descripcion: string; importe_neto: number }) =>
    apiFetch<HonorarioRecurrente>("/api/facturacion/honorarios", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  emitirHonorarioAhora: (id: number) =>
    apiFetch<Comprobante>(`/api/facturacion/honorarios/${id}/emitir-ahora`, { method: "POST" }),

  // Config ARCA
  obtenerConfig: () => apiFetch<any>("/api/facturacion/config"),

  guardarConfig: (data: {
    cuit: string;
    punto_venta: number;
    certificado_b64: string;
    clave_privada_b64: string;
    modo?: string;
  }) =>
    apiFetch<any>("/api/facturacion/config", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Pagos
  listarPagos: (estado?: string) =>
    apiFetch<any[]>("/api/facturacion/pagos", { params: { estado } }),
};

// ─── Agent (AI Chat) ──────────────────────────────────────────────────────────

export const agentApi = {
  dashboardChat: (
    message: string,
    history: any[] = [],
    session_id?: string
  ) =>
    apiFetch<{
      response: string;
      suggested_actions: any[];
      data_referenced: string[];
    }>("/api/agent/dashboard/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_history: history,
        session_id,
      }),
    }),

  assistantChat: (
    message: string,
    history: any[] = [],
    session_id?: string
  ) =>
    apiFetch<{ response: string; disclaimer: string | null }>(
      "/api/agent/assistant/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          conversation_history: history,
          session_id,
        }),
      }
    ),
};

// ─── Configuracion / API Keys ─────────────────────────────────────────────────

export interface ApiKeysConfig {
  telegram_bot_token: string | null;
  anthropic_api_key: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from: string | null;
  telegram_bot_token_env: boolean;
  anthropic_api_key_env: boolean;
}

export interface ApiKeysConfigFull extends ApiKeysConfig {
  telegram_webhook_url: string | null;
}

export const configuracionApi = {
  getApiKeys: () => apiFetch<ApiKeysConfigFull>("/api/configuracion/api-keys"),

  updateApiKeys: (data: Partial<Omit<ApiKeysConfigFull, "telegram_bot_token_env" | "anthropic_api_key_env">>) =>
    apiFetch<ApiKeysConfigFull>("/api/configuracion/api-keys", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  registrarWebhookTelegram: () =>
    apiFetch<{ ok: boolean; webhook_url: string; descripcion: string }>(
      "/api/configuracion/telegram/set-webhook",
      { method: "POST" }
    ),

  infoWebhookTelegram: () =>
    apiFetch<{ url: string; pending_updates: number; last_error: string | null }>(
      "/api/configuracion/telegram/webhook-info"
    ),

  generarCodigoTelegram: () =>
    apiFetch<{ codigo: string; expira_en: string; instrucciones: string }>(
      "/api/configuracion/telegram/generar-codigo",
      { method: "POST" }
    ),

  estadoTelegram: () =>
    apiFetch<{
      telegram_active: boolean;
      telegram_chat_id_configurado: boolean;
      webhook_url_configurada: boolean;
      token_configurado: boolean;
      codigo_pendiente: boolean;
    }>("/api/configuracion/telegram/estado"),
};
