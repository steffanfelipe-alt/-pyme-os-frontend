"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { clientesApi } from "@/lib/api";
import { ClienteForm } from "@/components/clientes/ClienteForm";

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientesApi.obtener(Number(id))
      .then(setInitialData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    );
  }

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
          <h1 className="text-xl font-semibold text-gray-900">Editar cliente</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {initialData?.nombre ?? "Cargando..."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {initialData && (
          <ClienteForm
            initialData={initialData}
            clienteId={Number(id)}
            onSuccess={() => router.push(`/clientes/${id}`)}
          />
        )}
      </div>
    </div>
  );
}
