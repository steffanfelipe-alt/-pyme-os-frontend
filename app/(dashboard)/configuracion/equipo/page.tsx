"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, X, Check, UserX } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface Empleado {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

interface EmpleadoForm {
  nombre: string;
  email: string;
  rol: string;
  password: string;
}

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

const ROL_LABELS: Record<string, string> = {
  dueno: "Dueño",
  contador: "Contador",
  administrativo: "Administrativo",
  solo_lectura: "Solo lectura",
};

const ROL_COLORS: Record<string, string> = {
  dueno: "bg-purple-100 text-purple-700",
  contador: "bg-blue-100 text-blue-700",
  administrativo: "bg-green-100 text-green-700",
  solo_lectura: "bg-gray-100 text-gray-600",
};

export default function EquipoPage() {
  const toast = useToast();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Empleado | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmpleadoForm>({ nombre: "", email: "", rol: "contador", password: "" });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Empleado[]>("/api/empleados");
      setEmpleados(data);
    } catch {
      toast.error("Error al cargar el equipo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) {
      toast.error("Nombre, email y contraseña son obligatorios");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/empleados", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success("Miembro del equipo creado");
      setMostrarForm(false);
      setForm({ nombre: "", email: "", rol: "contador", password: "" });
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al crear empleado");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setSaving(true);
    try {
      const payload: any = { nombre: form.nombre, rol: form.rol };
      if (form.password) payload.password = form.password;
      await apiFetch(`/api/empleados/${editando.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast.success("Empleado actualizado");
      setEditando(null);
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (emp: Empleado) => {
    try {
      await apiFetch(`/api/empleados/${emp.id}`, {
        method: "PUT",
        body: JSON.stringify({ activo: !emp.activo }),
      });
      toast.success(emp.activo ? "Empleado desactivado" : "Empleado activado");
      await cargar();
    } catch (e: any) {
      toast.error(e.message ?? "Error al cambiar estado");
    }
  };

  const iniciarEdicion = (emp: Empleado) => {
    setEditando(emp);
    setForm({ nombre: emp.nombre, email: emp.email, rol: emp.rol, password: "" });
    setMostrarForm(false);
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Equipo y roles</h2>
          <p className="text-sm text-gray-500 mt-1">Gestioná los miembros del estudio y sus permisos.</p>
        </div>
        <button
          onClick={() => { setMostrarForm(true); setEditando(null); setForm({ nombre: "", email: "", rol: "contador", password: "" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar miembro
        </button>
      </div>

      {/* Formulario agregar/editar */}
      {(mostrarForm || editando) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {editando ? "Editar miembro" : "Nuevo miembro del equipo"}
            </h3>
            <button
              onClick={() => { setMostrarForm(false); setEditando(null); }}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <form onSubmit={editando ? handleEditar : handleCrear} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Nombre completo</label>
                <input
                  className={INPUT}
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input
                  className={INPUT}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  disabled={!!editando}
                />
              </div>
              <div>
                <label className={LABEL}>Rol</label>
                <select
                  className={INPUT}
                  value={form.rol}
                  onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                >
                  {Object.entries(ROL_LABELS).map(([val, lab]) => (
                    <option key={val} value={val}>{lab}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>{editando ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
                <input
                  className={INPUT}
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={!editando}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                {saving ? "Guardando..." : editando ? "Actualizar" : "Crear miembro"}
              </button>
              <button
                type="button"
                onClick={() => { setMostrarForm(false); setEditando(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de empleados */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {empleados.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No hay miembros en el equipo</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Rol</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {empleados.map(emp => (
                <tr key={emp.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-medium text-gray-800">{emp.nombre}</td>
                  <td className="px-5 py-3.5 text-gray-500">{emp.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROL_COLORS[emp.rol] ?? "bg-gray-100 text-gray-600"}`}>
                      {ROL_LABELS[emp.rol] ?? emp.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {emp.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => iniciarEdicion(emp)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActivo(emp)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title={emp.activo ? "Desactivar" : "Activar"}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
