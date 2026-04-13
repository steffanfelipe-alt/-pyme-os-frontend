import { cn } from "@/lib/utils";

export type StatusType =
  | "vencido"
  | "urgente"
  | "ok"
  | "en_curso"
  | "pendiente"
  | "completado"
  | "neutro"
  | "activo"
  | "inactivo";

const STATUS_STYLES: Record<StatusType, string> = {
  vencido:    "bg-danger-bg text-danger-text border border-danger-border",
  urgente:    "bg-warning-bg text-warning-text border border-warning-border",
  ok:         "bg-success-bg text-success-text border border-success-border",
  completado: "bg-success-bg text-success-text border border-success-border",
  activo:     "bg-success-bg text-success-text border border-success-border",
  en_curso:   "bg-info-bg text-info-text border border-info-border",
  pendiente:  "bg-info-bg text-info-text border border-info-border",
  neutro:     "bg-neutral-bg text-neutral-text border border-neutral-border",
  inactivo:   "bg-neutral-bg text-neutral-text border border-neutral-border",
};

const STATUS_LABELS: Record<StatusType, string> = {
  vencido:    "Vencido",
  urgente:    "Urgente",
  ok:         "Ok",
  completado: "Completado",
  activo:     "Activo",
  en_curso:   "En curso",
  pendiente:  "Pendiente",
  neutro:     "Neutro",
  inactivo:   "Inactivo",
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
