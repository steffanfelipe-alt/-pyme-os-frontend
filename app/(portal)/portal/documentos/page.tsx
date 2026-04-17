"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { portalApi, isPortalAuthenticated } from "@/lib/portal-api";

const TIPOS_DOC = [
  "Factura de compra",
  "Factura de venta",
  "Extracto bancario",
  "Recibo de sueldo",
  "Comprobante de pago",
  "Declaración jurada",
  "Otro",
];

export default function PortalDocumentosPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [tipo, setTipo] = useState(TIPOS_DOC[0]);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubir = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPortalAuthenticated()) { router.replace("/portal/login"); return; }
    setSubiendo(true);
    setResultado(null);
    setError(null);
    try {
      await portalApi.subirDocumento(file, tipo);
      setResultado(`"${file.name}" subido correctamente`);
    } catch (err: any) {
      setError(err.message ?? "Error al subir el archivo");
    } finally {
      setSubiendo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [tipo, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.push("/portal")} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h1 className="text-base font-semibold text-gray-900">Documentos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-medium text-gray-800">Subir documento al estudio</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <input ref={fileRef} type="file" onChange={handleSubir} className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx,.xls,.xlsx" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={subiendo}
            className="w-full flex items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-all"
          >
            {subiendo ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Subiendo...</>
            ) : (
              <><Upload className="w-5 h-5" /> Seleccionar archivo</>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center">PDF, imagen, Word o Excel. Máximo 10 MB.</p>

          {resultado && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">{resultado}</p>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-sm font-medium text-blue-800 mb-1">¿Qué podés subir?</p>
          <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
            <li>Facturas de compra y venta</li>
            <li>Extractos bancarios</li>
            <li>Recibos de sueldo</li>
            <li>Comprobantes de pago de impuestos</li>
            <li>Cualquier documentación que tu estudio te solicite</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
