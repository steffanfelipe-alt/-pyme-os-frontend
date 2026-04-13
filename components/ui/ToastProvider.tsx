"use client";

import { createContext, useState, useCallback, useContext } from "react";
import { ToastContainer } from "./Toast";
import type { ToastItem, ToastType } from "./Toast";

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        success: (msg) => add("success", msg),
        error:   (msg) => add("error", msg),
        warning: (msg) => add("warning", msg),
        info:    (msg) => add("info", msg),
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
