"use client";

import { useRouter } from "next/navigation";
import { Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { clearToken } from "@/lib/api";

export default function PendientePage() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta pendiente</h1>
        <p className="text-gray-500 mb-8">
          Tu cuenta está siendo revisada. Recibirás un email cuando esté habilitada para operar.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 text-left space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-4">Próximos pasos:</p>
          {[
            "Verificación de datos del estudio",
            "Activación de la cuenta",
            "Acceso al sistema completo",
          ].map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {idx + 1}
              </div>
              <span className="text-sm text-gray-600">{step}</span>
              {idx === 0 && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/onboarding")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Completar configuración inicial
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
