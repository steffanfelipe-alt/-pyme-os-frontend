import { cn } from "@/lib/utils";
import type { EstadoAlerta } from "@/types/cliente";

interface RiskBadgeProps {
  nivel: EstadoAlerta | string | null;
  size?: "sm" | "md";
}

const CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  rojo: {
    label: "Riesgo alto",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
  amarillo: {
    label: "En observación",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-400",
  },
  verde: {
    label: "Al día",
    className: "bg-green-50 text-green-700 border border-green-200",
    dot: "bg-green-500",
  },
  sin_datos: {
    label: "Sin datos",
    className: "bg-gray-50 text-gray-500 border border-gray-200",
    dot: "bg-gray-300",
  },
};

export function RiskBadge({ nivel, size = "sm" }: RiskBadgeProps) {
  const key = nivel ?? "sin_datos";
  const config = CONFIG[key] ?? CONFIG["sin_datos"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
