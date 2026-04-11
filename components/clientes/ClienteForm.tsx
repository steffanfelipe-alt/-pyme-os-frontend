"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientesApi, empleadosApi, type Empleado } from "@/lib/api";
import type { ClienteCreate, CondicionFiscal, TipoPersona } from "@/types/cliente";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

const CONDICIONES: { value: CondicionFiscal; label: string }[] = [
  { value: "responsable_inscripto", label: "Responsable Inscripto" },
  { value: "monotributista", label: "Monotributista" },
  { value: "exento", label: "Exento" },
  { value: "no_responsable", label: "No Responsable" },
  { value: "relacion_de_dependencia", label: "Relación de Dependencia" },
  { value: "autonomos", label: "Autónomos" },
  { value: "sujeto_no_categorizado", label: "Sujeto No Categorizado" },
];

interface ClienteFormProps {
  initialData?: Partial<ClienteCreate>;
  clienteId?: number;
  onSuccess?: () => void;
}

export function ClienteForm({ initialData, clienteId, onSuccess }: ClienteFormProps) {
  const router = useRouter();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ClienteCreate>({
    tipo_persona: initialData?.tipo_persona ?? "fisica",
    nombre: initialData?.nombre ?? "",
    cuit_cuil: initialData?.cuit_cuil ?? "",
    condicion_fiscal: initialData?.condicion_fiscal ?? "monotributista",
    email: initialData?.email ?? "",
    telefono: initialData?.telefono ?? "",
    telefono_whatsapp: initialData?.telefono_whatsapp ?? "",
    notas: initialData?.notas ?? "",
    contador_asignado_id: initialData?.contador_asignado_id,
    honorarios_mensuales: initialData?.honorarios_mensuales,
  });

  useEffect(() => {
    empleadosApi.listar().then(setEmpleados).catch(() => {});
  }, []);

  const set = (field: keyof ClienteCreate, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: ClienteCreate = {
        ...form,
        email: form.email || undefined,
        telefono: form.telefono || undefined,
        telefono_whatsapp: form.telefono_whatsapp || undefined,
        notas: form.notas || undefined,
      };

      if (clienteId) {
        await clientesApi.actualizar(clienteId, payload);
      } else {
        const nuevo = await clientesApi.crear(payload);
        // Aplicar plantillas automáticamente
        await clientesApi.aplicarPlantillas(nuevo.id).catch(() => {});
        router.push(`/clientes/${nuevo.id}`);
        return;
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Tipo persona */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Tipo de persona
        </label>
        <div className="flex gap-2">
          {(["fisica", "juridica"] as TipoPersona[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("tipo_persona", t)}
              className={cn(
                "flex-1 py-2 text-sm rounded-lg border font-medium transition-colors",
                form.tipo_persona === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              )}
            >
              {t === "fisica" ? "Persona física" : "Persona jurídica"}
            </button>
          ))}
        </div>
      </div>

      {/* Nombre */}
      <Field label="Nombre / Razón social *">
        <input
          required
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder={
            form.tipo_persona === "fisica" ? "Apellido, Nombre" : "Nombre del comercio o empresa"
          }
          className={inputCls}
        />
      </Field>

      {/* CUIT/CUIL */}
      <Field label="CUIT / CUIL *">
        <input
          required
          value={form.cuit_cuil}
          onChange={(e) => set("cuit_cuil", e.target.value.replace(/\D/g, ""))}
          placeholder="20123456789"
          maxLength={11}
          className={inputCls}
        />
        <p className="text-[11px] text-gray-400 mt-1">Solo números, sin guiones</p>
      </Field>

      {/* Condición fiscal */}
      <Field label="Condición fiscal *">
        <select
          required
          value={form.condicion_fiscal}
          onChange={(e) => set("condicion_fiscal", e.target.value as CondicionFiscal)}
          className={inputCls}
        >
          {CONDICIONES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Email */}
      <Field label="Email">
        <input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="cliente@ejemplo.com"
          className={inputCls}
        />
      </Field>

      {/* Teléfono */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Teléfono">
          <input
            value={form.telefono ?? ""}
            onChange={(e) => set("telefono", e.target.value)}
            placeholder="11 1234-5678"
            className={inputCls}
          />
        </Field>
        <Field label="WhatsApp">
          <input
            value={form.telefono_whatsapp ?? ""}
            onChange={(e) => set("telefono_whatsapp", e.target.value)}
            placeholder="11 1234-5678"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Contador asignado */}
      <Field label="Contador asignado">
        <select
          value={form.contador_asignado_id ?? ""}
          onChange={(e) =>
            set("contador_asignado_id", e.target.value ? Number(e.target.value) : undefined)
          }
          className={inputCls}
        >
          <option value="">Sin asignar</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre} ({e.rol})
            </option>
          ))}
        </select>
      </Field>

      {/* Honorarios */}
      <Field label="Honorarios mensuales (ARS)">
        <input
          type="number"
          value={form.honorarios_mensuales ?? ""}
          onChange={(e) =>
            set("honorarios_mensuales", e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder="50000"
          min={0}
          className={inputCls}
        />
      </Field>

      {/* Notas */}
      <Field label="Notas internas">
        <textarea
          value={form.notas ?? ""}
          onChange={(e) => set("notas", e.target.value)}
          placeholder="Observaciones, particularidades del cliente..."
          rows={3}
          className={cn(inputCls, "resize-none")}
        />
      </Field>

      {/* Acciones */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {clienteId ? "Guardar cambios" : "Crear cliente"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-gray-300 bg-white";
