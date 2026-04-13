"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, setToken } from "@/lib/api";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await authApi.login(email, password);
      setToken(access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-border rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-text-tertiary bg-surface-card text-text-primary";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold tracking-tight">PO</span>
          </div>
          <div>
            <p className="text-xl font-semibold text-text-primary leading-none">PyME OS</p>
            <p className="text-xs text-text-muted mt-0.5">Gestión contable inteligente</p>
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-6">
          <h1 className="text-lg font-semibold text-text-primary mb-0.5">Iniciar sesión</h1>
          <p className="text-sm text-text-muted mb-5">Ingresá con tu cuenta del estudio</p>

          {error && (
            <div className="mb-4 p-3 bg-danger-bg border border-danger-border rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-danger-text mt-0.5 shrink-0" />
              <span className="text-sm text-danger-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@estudio.com"
                required
                autoFocus
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-text-secondary">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/login/reset")}
                  className="text-xs text-info-text hover:text-brand-700"
                >
                  ¿Olvidaste la contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputCls}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-5">
          ¿Primera vez?{" "}
          <a href="/register" className="text-info-text hover:text-brand-700 font-medium">
            Crear estudio nuevo
          </a>
        </p>
      </div>
    </div>
  );
}
