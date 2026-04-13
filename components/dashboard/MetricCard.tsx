import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "danger" | "warning" | "success";
  trend?: { value: number; label: string };
}

const STYLES = {
  default: {
    card:  "bg-surface-card border-border",
    icon:  "bg-info-bg text-info-strong",
    value: "text-text-primary",
  },
  danger: {
    card:  "bg-danger-bg border-danger-border",
    icon:  "bg-danger-border text-danger-strong",
    value: "text-danger-text",
  },
  warning: {
    card:  "bg-warning-bg border-warning-border",
    icon:  "bg-warning-border text-warning-strong",
    value: "text-warning-text",
  },
  success: {
    card:  "bg-success-bg border-success-border",
    icon:  "bg-success-border text-success-strong",
    value: "text-success-text",
  },
};

export function MetricCard({ title, value, subtitle, icon: Icon, variant = "default", trend }: MetricCardProps) {
  const s = STYLES[variant];
  return (
    <div className={cn("rounded-xl border p-3.5", s.card)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className={cn("text-3xl font-semibold", s.value)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-text-tertiary mt-0.5">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-2xs mt-1 font-medium",
              trend.value >= 0 ? "text-success-text" : "text-danger-text"
            )}>
              {trend.value > 0 ? "▲" : "▼"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ml-3", s.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
