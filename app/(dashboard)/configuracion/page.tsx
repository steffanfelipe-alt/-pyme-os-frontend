"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfiguracionPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/configuracion/perfil");
  }, [router]);
  return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;
}
