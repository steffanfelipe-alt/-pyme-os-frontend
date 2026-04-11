"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, setToken } from "@/lib/api";
import { AlertCircle, CheckCircle2, Building2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Paso = "verificando" | "setup" | "registro" | "listo";

export default function RegisterPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("verificando");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup (primer estudio)
  const [setup, setSetup] = useState({
    nombre_estudio: "",
    nombre_dueno: "",
    email: "",
    password: "",
  });

  // Registro normal (empleado invitado)
  const [registro, setRegistro] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    authApi
      .setupStatus()
      .then(({ necesita_setup }) => {
        setPaso(necesita_setup ? "setup" : "registro");
      })
      .catch(() => {
        // Si el backend no responde, mostrar setup por defecto
        setPaso("setup");
      });
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setup.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await authApi.setupEstudio(setup);
      setToken(access_token);
      setPaso("listo");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el estudio");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registro.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await authApi.register(
        registro.email,
        registro.password,
        registro.nombre
      );
      setToken(access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  // ─── Verificando ───────────────────────────────────────────────────────────
  if (paso === "verificando") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Verificando estado del sistema...</p>
        </div>
      </div>
    );
  }

  // ─── Éxito ─────────────────────────────────────────────────────────────────
  if (paso === "listo") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">¡Estudio creado!</h1>
          <p className="text-sm text-gray-500">
            {setup.nombre_estudio} está listo. Te estamos redirigiendo al dashboard...
          </p>
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full animate-[grow_2s_ease-in-out]" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold tracking-tight">PO</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 leading-none">PyME OS</p>
            <p className="text-xs text-gray-400 mt-0.5">Gestión contable inteligente</p>
          </div>
        </div>

        {/* ── SETUP: Primer estudio ── */}
        {paso === "setup" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">Crear tu estudio</h1>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Primera vez en PyME OS. Vas a ser el dueño del estudio.
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSetup} className="space-y-4">
              <FormField label="Nombre del estudio" icon={<Building2 className="h-4 w-4 text-gray-400" />}>
                <input
                  required
                  autoFocus
                  value={setup.nombre_estudio}
                  onChange={(e) => setSetup((p) => ({ ...p, nombre_estudio: e.target.value }))}
                  placeholder="Estudio Contable García"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Tu nombre completo" icon={<User className="h-4 w-4 text-gray-400" />}>
                <input
                  required
                  value={setup.nombre_dueno}
                  onChange={(e) => setSetup((p) => ({ ...p, nombre_dueno: e.target.value }))}
                  placeholder="García, Juan Carlos"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Email" icon={<Mail className="h-4 w-4 text-gray-400" />}>
                <input
                  required
                  type="email"
                  value={setup.email}
                  onChange={(e) => setSetup((p) => ({ ...p, email: e.target.value }))}
                  placeholder="juan@estudio.com"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Contraseña" icon={<Lock className="h-4 w-4 text-gray-400" />}>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={setup.password}
                    onChange={(e) => setSetup((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className={cn(inputCls, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={setup.password} />
              </FormField>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? "Creando estudio..." : "Crear estudio y comenzar"}
              </button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-semibold">Sos el primer usuario</span> — se te asignará el rol de{" "}
                <span className="font-semibold">Dueño</span> automáticamente. Después podrás invitar
                contadores y empleados desde Configuración.
              </p>
            </div>
          </div>
        )}

        {/* ── REGISTRO: Usuario adicional ── */}
        {paso === "registro" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">Crear cuenta</h1>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Registrate para acceder al sistema de tu estudio
            </p>

            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleRegistro} className="space-y-4">
              <FormField label="Tu nombre completo" icon={<User className="h-4 w-4 text-gray-400" />}>
                <input
                  required
                  autoFocus
                  value={registro.nombre}
                  onChange={(e) => setRegistro((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Apellido, Nombre"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Email" icon={<Mail className="h-4 w-4 text-gray-400" />}>
                <input
                  required
                  type="email"
                  value={registro.email}
                  onChange={(e) => setRegistro((p) => ({ ...p, email: e.target.value }))}
                  placeholder="tu@estudio.com"
                  className={inputCls}
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Debe coincidir con el email que el dueño registró en el sistema
                </p>
              </FormField>

              <FormField label="Contraseña" icon={<Lock className="h-4 w-4 text-gray-400" />}>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={registro.password}
                    onChange={(e) => setRegistro((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className={cn(inputCls, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={registro.password} />
              </FormField>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-5">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const len = password.length;
  const strength =
    len >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)
      ? 3
      : len >= 8
      ? 2
      : 1;

  const labels = ["", "Débil", "Buena", "Fuerte"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-green-500"];
  const textColors = ["", "text-red-500", "text-amber-600", "text-green-600"];

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1 rounded-full transition-all",
              i <= strength ? colors[strength] : "bg-gray-100"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[10px] mt-1 font-medium", textColors[strength])}>
        Contraseña {labels[strength]}
      </p>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-gray-300 bg-white";
