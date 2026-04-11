"use client";

import { useState, useEffect } from "react";
import { parseJwt } from "@/lib/utils";

export interface UserPayload {
  sub: string;
  email: string;
  nombre: string;
  rol: "dueno" | "contador" | "administrativo" | "rrhh" | null;
  empleado_id: number | null;
}

export function useAuth() {
  const [user, setUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const payload = parseJwt(token) as unknown as UserPayload;
      setUser(payload);
    }
  }, []);

  const isDueno = user?.rol === "dueno";
  const isContador = user?.rol === "contador";
  const canManage = isDueno || isContador;

  return { user, isDueno, isContador, canManage };
}
