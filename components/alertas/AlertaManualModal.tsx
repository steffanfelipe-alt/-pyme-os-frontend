"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Cliente {
  id: number;
  nombre: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clientePreseleccionado?: { id: number; nombre: string };
}

const TIPOS_VENCIMIENTO = ["IVA", "Ganancias", "IIBB", "Monotributo", "Bienes Personales", "F931", "Otro"];
const TIPOS_DOCUMENTO = ["Factura de compra", "Factura de venta", "Extracto bancario", "Recibo de sueldo", "Comprobante de pago", "Otro"];

export function AlertaManualModal({ open, onClose, onSuccess, clientePreseleccionado }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState({
    cliente_id: clientePreseleccionado?.id ?? "",
    titulo: "",
    mensaje: "",
    canal: "email",
    tipo_vencimiento: "",
    tipo_documento: "",
    documento_referencia: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    apiFetch<{ items?: Cliente[] } | Cliente[]>("/api/clientes?limit=200").then(data => {
      const list = Array.isArray(data) ? data : (data as any).items ?? [];
      setClientes(list);
    }).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (clientePreseleccionado) {
      setForm(f => ({ ...f, cliente_id: clientePreseleccionado.id }));
    }
  }, [clientePreseleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.titulo || !form.mensaje) {
      setError("Cliente, título y mensaje son obligatorios");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiFetch("/alertas/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: Number(form.cliente_id),
          titulo: form.titulo,
          mensaje: form.mensaje,
          canal: form.canal,
          tipo_vencimiento: form.tipo_vencimiento || null,
          tipo_documento: form.tipo_documento || null,
          documento_referencia: form.documento_referencia || null,
        }),
      });
      onSuccess?.();
      onClose();
      setForm({ cliente_id: "", titulo: "", mensaje: "", canal: "email", tipo_vencimiento: "", tipo_documento: "", documento_referencia: "" });
    } catch (e: any) {
      setError(e.message ?? "Error al enviar la alerta");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Nueva alerta manual</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            {clientePreseleccionado ? (
              <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">{clientePreseleccionado.nombre}</div>
            ) : (
              <select
                value={form.cliente_id}
                onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            )}
          </div>

          {/* Tipo de vencimiento (opcional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de obligación</label>
              <select
                value={form.tipo_vencimiento}
                onChange={e => setForm(f => ({ ...f, tipo_vencimiento: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                {TIPOS_VENCIMIENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
              <select
                value={form.tipo_documento}
                onChange={e => setForm(f => ({ ...f, tipo_documento: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin especificar</option>
                {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Documento referencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento de referencia</label>
            <input
              type="text"
              value={form.documento_referencia}
              onChange={e => setForm(f => ({ ...f, documento_referencia: e.target.value }))}
              placeholder="Ej: Factura de compra marzo 2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título (asunto) *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Asunto de la alerta"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
            <textarea
              value={form.mensaje}
              onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
              placeholder="Mensaje que verá el cliente..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Canal de envío */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Canal de envío</label>
            <div className="flex gap-3">
              {[
                { value: "email", label: "Solo email" },
                { value: "portal", label: "Solo portal" },
                { value: "ambos", label: "Email y portal" },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="canal"
                    value={opt.value}
                    checked={form.canal === opt.value}
                    onChange={e => setForm(f => ({ ...f, canal: e.target.value }))}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Enviando..." : "Enviar alerta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
