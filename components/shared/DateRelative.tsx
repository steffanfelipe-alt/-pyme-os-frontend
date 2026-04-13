"use client";

import { useState, useEffect } from "react";

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin}m`;
  if (diffHr < 24) return `hace ${diffHr}h`;
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} mes`;
  return `hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
}

function formatAbsolute(date: Date): string {
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DateRelativeProps {
  date: string | Date;
  className?: string;
}

export function DateRelative({ date, className }: DateRelativeProps) {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const [label, setLabel] = useState(() => formatRelative(parsed));

  // Actualizar cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setLabel(formatRelative(parsed));
    }, 60_000);
    return () => clearInterval(interval);
  }, [parsed]);

  return (
    <span
      title={formatAbsolute(parsed)}
      className={className}
    >
      {label}
    </span>
  );
}
