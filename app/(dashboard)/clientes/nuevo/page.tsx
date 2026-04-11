"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClienteForm } from "@/components/clientes/ClienteForm";

export default function NuevoClientePage() {
  const router = useRouter();

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nuevo cliente</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Completá los datos del cliente para agregarlo al sistema
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <ClienteForm />
      </div>
    </div>
  );
}
