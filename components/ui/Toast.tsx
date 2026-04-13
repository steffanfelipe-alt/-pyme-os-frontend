"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  error:   <XCircle className="h-4 w-4 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
  info:    <Info className="h-4 w-4 shrink-0" />,
};

const STYLES: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info:    "bg-blue-50 border-blue-200 text-blue-800",
};

const ICON_COLOR: Record<ToastType, string> = {
  success: "text-green-600",
  error:   "text-red-600",
  warning: "text-amber-600",
  info:    "text-blue-600",
};

function ToastSingle({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10);
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(item.id), 300);
    }, 4500);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [item.id, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-md text-sm w-80 max-w-[calc(100vw-2.5rem)]",
        "transition-all duration-300 ease-out",
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6",
        STYLES[item.type]
      )}
    >
      <span className={cn("mt-0.5", ICON_COLOR[item.type])}>
        {ICONS[item.type]}
      </span>
      <p className="flex-1 leading-relaxed break-words">{item.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(item.id), 300);
        }}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastSingle item={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
