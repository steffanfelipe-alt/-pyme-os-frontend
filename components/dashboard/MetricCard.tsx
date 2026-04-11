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
  default: { card: "bg-white border-gray-100", icon: "bg-blue-50 text-blue-600", value: "text-gray-900" },
  danger:  { card: "bg-red-50 border-red-100", icon: "bg-red-100 text-red-600", value: "text-red-700" },
  warning: { card: "bg-amber-50 border-amber-100", icon: "bg-amber-100 text-amber-600", value: "text-amber-700" },
  success: { card: "bg-green-50 border-green-100", icon: "bg-green-100 text-green-600", value: "text-green-700" },
};

export function MetricCard({ title, value, subtitle, icon: Icon, variant = "default", trend }: MetricCardProps) {
  const s = STYLES[variant];
  return (
    <div className={cn("rounded-xl border p-5", s.card)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className={cn("text-2xl font-bold", s.value)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs mt-1 font-medium", trend.value >= 0 ? "text-green-600" : "text-red-500")}>
              {trend.value > 0 ? "▲" : "▼"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", s.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
