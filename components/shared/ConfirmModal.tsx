"use client";

import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmStyles = {
    danger:  "bg-danger-strong hover:bg-red-700 text-white",
    warning: "bg-warning-strong hover:bg-amber-700 text-white",
    default: "bg-brand-600 hover:bg-brand-700 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              variant === "danger" ? "bg-danger-bg" :
              variant === "warning" ? "bg-warning-bg" : "bg-info-bg"
            )}>
              <AlertTriangle className={cn(
                "h-4 w-4",
                variant === "danger" ? "text-danger-text" :
                variant === "warning" ? "text-warning-text" : "text-info-text"
              )} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">{title}</h2>
              {description && (
                <p className="text-sm text-text-muted mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-neutral-bg rounded-lg transition-colors ml-2 shrink-0"
          >
            <X className="h-4 w-4 text-text-tertiary" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 border border-border rounded-lg text-sm text-text-secondary hover:bg-surface transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50",
              confirmStyles[variant]
            )}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
