"use client";

import { useState } from "react";
import { Shield, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

function PasswordInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${INPUT} pr-10`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function SeguridadPage() {
  const toast = useToast();
  const [passwordForm, setPasswordForm] = useState({
    password_actual: "",
    password_nueva: "",
    password_confirmacion: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.password_actual || !passwordForm.password_nueva) {
      toast.error("Completá todos los campos");
      return;
    }
    if (passwordForm.password_nueva !== passwordForm.password_confirmacion) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (passwordForm.password_nueva.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          password_actual: passwordForm.password_actual,
          password_nueva: passwordForm.password_nueva,
        }),
      });
      toast.success("Contraseña actualizada correctamente");
      setPasswordForm({ password_actual: "", password_nueva: "", password_confirmacion: "" });
    } catch (e: any) {
      toast.error(e.message ?? "Error al cambiar contraseña");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Seguridad</h2>
        <p className="text-sm text-gray-500 mt-1">Gestioná tu contraseña y las sesiones activas.</p>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Key className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Cambiar contraseña</h3>
        </div>
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <PasswordInput
            label="Contraseña actual"
            value={passwordForm.password_actual}
            onChange={v => setPasswordForm(f => ({ ...f, password_actual: v }))}
          />
          <PasswordInput
            label="Nueva contraseña"
            value={passwordForm.password_nueva}
            onChange={v => setPasswordForm(f => ({ ...f, password_nueva: v }))}
            placeholder="Mínimo 8 caracteres"
          />
          <PasswordInput
            label="Confirmar nueva contraseña"
            value={passwordForm.password_confirmacion}
            onChange={v => setPasswordForm(f => ({ ...f, password_confirmacion: v }))}
          />
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      </div>

      {/* Info de seguridad */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Recomendaciones de seguridad</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            Usá una contraseña de al menos 12 caracteres con letras, números y símbolos.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            No compartas tu contraseña con nadie, ni siquiera con el equipo.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            Cerrá sesión cuando uses dispositivos que no son tuyos.
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            Si sospechás que tu cuenta fue comprometida, cambiá la contraseña inmediatamente.
          </li>
        </ul>
      </div>
    </div>
  );
}
