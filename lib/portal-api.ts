const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Portal token (separate from dashboard JWT) ────────────────────────────────

function getPortalToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("portal_access_token");
}

export function setPortalToken(token: string): void {
  localStorage.setItem("portal_access_token", token);
}

export function clearPortalToken(): void {
  localStorage.removeItem("portal_access_token");
}

export function isPortalAuthenticated(): boolean {
  return !!getPortalToken();
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function portalFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getPortalToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  }).catch(() => {
    throw new Error("No se pudo conectar al servidor");
  });

  if (res.status === 401) {
    clearPortalToken();
    if (typeof window !== "undefined") window.location.href = "/portal/login";
    throw new Error("Sesión expirada");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Error desconocido" }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Portal API ────────────────────────────────────────────────────────────────

export interface PortalFicha {
  cliente: {
    id: number;
    nombre: string;
    cuit_cuil: string;
    condicion_fiscal: string;
    email: string | null;
  };
  vencimientos_proximos: {
    id: number;
    tipo: string;
    descripcion: string;
    fecha_vencimiento: string;
    dias_para_vencer: number;
    estado: string;
  }[];
  notificaciones_no_leidas: number;
  abono_estado: {
    monto: number;
    estado: string;
    periodo: string;
  } | null;
}

export interface PortalNotificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
  tipo: string | null;
}

export interface PortalVencimiento {
  id: number;
  tipo: string;
  descripcion: string;
  fecha_vencimiento: string;
  estado: string;
  dias_para_vencer: number;
}

export interface PortalCobro {
  id: number;
  monto: number;
  fecha_cobro: string;
  estado: string;
  periodo: string;
}

export const portalApi = {
  login: (email: string, password: string) =>
    portalFetch<{ access_token: string; token_type: string }>("/portal/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  ficha: () => portalFetch<PortalFicha>("/portal/auth/ficha"),

  notificaciones: () => portalFetch<PortalNotificacion[]>("/portal/auth/notificaciones"),

  marcarLeida: (id: number) =>
    portalFetch<void>(`/portal/auth/notificaciones/${id}/leer`, { method: "PUT" }),

  marcarTodasLeidas: () =>
    portalFetch<void>("/portal/auth/notificaciones/leer-todas", { method: "PUT" }),

  vencimientos: () => portalFetch<PortalVencimiento[]>("/portal/auth/vencimientos"),

  cobros: () => portalFetch<PortalCobro[]>("/portal/auth/cobros"),

  subirDocumento: (file: File, tipo: string) => {
    const token = getPortalToken();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo_documento", tipo);
    return fetch(`${BASE_URL}/portal/auth/documentos`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al subir" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      return res.json();
    });
  },
};
