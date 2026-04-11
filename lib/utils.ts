import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFecha(dateString: string | null): string {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateString));
}

export function formatFechaRelativa(dateString: string | null): string {
  if (!dateString) return "Sin actividad";
  const diff = Math.max(0, Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 86400000
  ));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return `Hace ${diff} días`;
  if (diff < 30) return `Hace ${Math.floor(diff / 7)} semanas`;
  return `Hace ${Math.floor(diff / 30)} meses`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatHoras(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh === 0) return `${mm}min`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}min`;
}

export function diasRestantesLabel(dias: number | null): string {
  if (dias === null) return "—";
  if (dias < 0) return `Vencido hace ${Math.abs(dias)}d`;
  if (dias === 0) return "Vence HOY";
  if (dias === 1) return "Vence mañana";
  return `${dias} días`;
}

export function condicionFiscalLabel(cf: string): string {
  const map: Record<string, string> = {
    responsable_inscripto: "Resp. Inscripto",
    monotributista: "Monotributista",
    exento: "Exento",
    no_responsable: "No Responsable",
    relacion_de_dependencia: "Rel. de Dependencia",
    autonomos: "Autónomos",
    sujeto_no_categorizado: "No categorizado",
  };
  return map[cf] ?? cf;
}

export function tipoVencimientoLabel(tipo: string): string {
  const map: Record<string, string> = {
    iva: "IVA",
    ddjj_anual: "DDJJ Anual",
    monotributo: "Monotributo",
    iibb: "IIBB",
    ganancias: "Ganancias",
    bienes_personales: "Bienes Personales",
    autonomos: "Autónomos",
    sueldos_cargas: "Sueldos y Cargas",
    otro: "Otro",
  };
  return map[tipo] ?? tipo.toUpperCase();
}

export function prioridadLabel(p: string): string {
  const map: Record<string, string> = {
    baja: "Baja",
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente",
  };
  return map[p] ?? p;
}

export function estadoTareaLabel(e: string): string {
  const map: Record<string, string> = {
    pendiente: "Pendiente",
    en_progreso: "En progreso",
    completada: "Completada",
    cancelada: "Cancelada",
  };
  return map[e] ?? e;
}

export function parseJwt(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

export function formatCuit(cuit: string): string {
  const digits = cuit.replace(/\D/g, "");
  if (digits.length !== 11) return cuit;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}
