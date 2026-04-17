"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Mail, Send, Link2, Loader2, Wifi, WifiOff, Eye, EyeOff } from "lucide-react";
import { configuracionApi, emailsApi } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";

function SecretInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const isMasked = value.startsWith("••••");
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={isMasked ? "" : value}
          onChange={e => onChange(e.target.value)}
          placeholder={isMasked ? "••••••••  (configurado)" : placeholder}
          className={`${INPUT} pr-10`}
          autoComplete="off"
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

export default function IntegracionesPage() {
  const toast = useToast();
  const router = useRouter();
  // Telegram
  const [tg, setTg] = useState({ token: "", webhook_url: "" });
  const [savingTg, setSavingTg] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [codigo, setCodigo] = useState<{ codigo: string; expira_en: string } | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<{ url: string; last_error: string | null } | null>(null);

  // Gmail
  const [gmail, setGmail] = useState<{ conectado: boolean; gmail_address?: string } | null>(null);
  const [studioEmail, setStudioEmail] = useState("");
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [conectandoGmail, setConectandoGmail] = useState(false);

  // SMTP
  const [smtp, setSmtp] = useState({ host: "", port: "", user: "", password: "", from: "" });
  const [savingSmtp, setSavingSmtp] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      configuracionApi.getApiKeys().catch(() => null),
      emailsApi.estadoGmail().catch(() => null),
    ]).then(([keys, gmailStatus]) => {
      if (keys) {
        setTg({ token: keys.telegram_bot_token ?? "", webhook_url: keys.telegram_webhook_url ?? "" });
        setSmtp({
          host: keys.smtp_host ?? "",
          port: keys.smtp_port?.toString() ?? "",
          user: keys.smtp_user ?? "",
          password: keys.smtp_password ?? "",
          from: keys.smtp_from ?? "",
        });
        setStudioEmail(keys.smtp_from ?? "");
      }
      if (gmailStatus) setGmail(gmailStatus);
    }).finally(() => setLoading(false));
  }, []);

  // Callback OAuth Gmail — read params from window.location to avoid useSearchParams/Suspense
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const scope = params.get("scope");
    if (code && scope?.includes("gmail")) {
      setConectandoGmail(true);
      const redirect_uri = window.location.origin + "/configuracion/integraciones";
      emailsApi.completarOAuthGmail(code, redirect_uri, studioEmail || "studio")
        .then(res => {
          setGmail({ conectado: true, gmail_address: res.gmail_address });
          router.replace("/configuracion/integraciones");
          toast.success("Gmail conectado exitosamente");
        })
        .catch(e => toast.error(e.message ?? "Error al conectar Gmail"))
        .finally(() => setConectandoGmail(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveTg = async () => {
    setSavingTg(true);
    try {
      const payload: any = { telegram_webhook_url: tg.webhook_url };
      if (tg.token && !tg.token.startsWith("••••")) payload.telegram_bot_token = tg.token;
      await configuracionApi.updateApiKeys(payload);
      toast.success("Configuración de Telegram guardada");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar");
    } finally {
      setSavingTg(false);
    }
  };

  const handleRegistrarWebhook = async () => {
    setRegistrando(true);
    setWebhookInfo(null);
    try {
      await configuracionApi.registrarWebhookTelegram();
      const info = await configuracionApi.infoWebhookTelegram();
      setWebhookInfo(info);
      toast.success("Webhook registrado");
    } catch (e: any) {
      toast.error(e.message ?? "Error al registrar webhook");
    } finally {
      setRegistrando(false);
    }
  };

  const handleGenerarCodigo = async () => {
    setGenerandoCodigo(true);
    setCodigo(null);
    try {
      const r = await configuracionApi.generarCodigoTelegram();
      setCodigo(r);
      const msLeft = new Date(r.expira_en).getTime() - Date.now();
      if (msLeft > 0) setTimeout(() => setCodigo(null), msLeft);
    } catch (e: any) {
      toast.error(e.message ?? "Error al generar código");
    } finally {
      setGenerandoCodigo(false);
    }
  };

  const handleConectarGmail = async () => {
    setLoadingGmail(true);
    try {
      const redirect_uri = window.location.origin + "/configuracion/integraciones";
      const { auth_url } = await emailsApi.iniciarOAuthGmail(redirect_uri);
      window.location.href = auth_url;
    } catch (e: any) {
      toast.error(e.message ?? "Error al iniciar OAuth");
      setLoadingGmail(false);
    }
  };

  const handleDesconectarGmail = async () => {
    await emailsApi.desconectarGmail().catch(() => {});
    setGmail({ conectado: false });
    toast.success("Gmail desconectado");
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const payload: any = {
        smtp_host: smtp.host || null,
        smtp_port: smtp.port ? parseInt(smtp.port) : null,
        smtp_user: smtp.user || null,
        smtp_from: smtp.from || null,
      };
      if (smtp.password && !smtp.password.startsWith("••••")) payload.smtp_password = smtp.password;
      await configuracionApi.updateApiKeys(payload);
      toast.success("Configuración SMTP guardada");
    } catch (e: any) {
      toast.error(e.message ?? "Error al guardar SMTP");
    } finally {
      setSavingSmtp(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-2xl" />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Integraciones</h2>
        <p className="text-sm text-gray-500 mt-1">Conectá el estudio con servicios externos: Telegram, Gmail y SMTP.</p>
      </div>

      {/* Telegram */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-800">Telegram Bot</h3>
        </div>
        <SecretInput
          label="Token del bot"
          value={tg.token}
          onChange={v => setTg(t => ({ ...t, token: v }))}
          placeholder="123456789:AABBccDD..."
        />
        <div>
          <label className={LABEL}>URL del webhook</label>
          <div className="flex gap-2">
            <input
              value={tg.webhook_url}
              onChange={e => setTg(t => ({ ...t, webhook_url: e.target.value }))}
              placeholder="https://xxxx.ngrok-free.app"
              className={INPUT}
            />
            <button
              onClick={handleRegistrarWebhook}
              disabled={registrando || !tg.webhook_url}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {registrando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {registrando ? "..." : "Registrar"}
            </button>
          </div>
          {webhookInfo && (
            <p className={`mt-1.5 text-xs ${webhookInfo.last_error ? "text-red-600" : "text-green-600"}`}>
              {webhookInfo.last_error ? `Error: ${webhookInfo.last_error}` : `Webhook activo: ${webhookInfo.url}`}
            </p>
          )}
        </div>

        {/* Código de vinculación */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">Vincular cuenta personal</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Generá un código y envialo al bot: <code className="bg-gray-100 px-1 rounded">/vincular CODIGO</code>
              </p>
            </div>
            <button
              onClick={handleGenerarCodigo}
              disabled={generandoCodigo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {generandoCodigo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
              Generar código
            </button>
          </div>
          {codigo && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-xs text-blue-400 mb-1">
                Expira: {new Date(codigo.expira_en).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="font-mono text-2xl font-bold text-blue-700 tracking-widest">{codigo.codigo}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveTg}
            disabled={savingTg}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingTg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {savingTg ? "Guardando..." : "Guardar Telegram"}
          </button>
        </div>
      </div>

      {/* Gmail */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-gray-800">Gmail (recepción de emails)</h3>
        </div>
        {conectandoGmail ? (
          <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Completando conexión con Google...
          </div>
        ) : gmail?.conectado ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Conectado</p>
                <p className="text-xs text-green-600">{gmail.gmail_address}</p>
              </div>
            </div>
            <button onClick={handleDesconectarGmail} className="text-xs text-red-500 hover:text-red-700 hover:underline">
              Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <WifiOff className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-500">Gmail no conectado</p>
            </div>
            <div>
              <label className={LABEL}>Email del estudio</label>
              <input
                value={studioEmail}
                onChange={e => setStudioEmail(e.target.value)}
                placeholder="miestudio@gmail.com"
                className={INPUT}
              />
            </div>
            <button
              onClick={handleConectarGmail}
              disabled={loadingGmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
            >
              {loadingGmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {loadingGmail ? "Redirigiendo a Google..." : "Conectar con Google OAuth"}
            </button>
          </div>
        )}
      </div>

      {/* SMTP */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Correo saliente (SMTP)</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Host SMTP</label>
            <input
              value={smtp.host}
              onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))}
              placeholder="smtp.gmail.com"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Puerto</label>
            <input
              type="number"
              value={smtp.port}
              onChange={e => setSmtp(s => ({ ...s, port: e.target.value }))}
              placeholder="587"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Usuario</label>
            <input
              value={smtp.user}
              onChange={e => setSmtp(s => ({ ...s, user: e.target.value }))}
              placeholder="usuario@gmail.com"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Email remitente (From)</label>
            <input
              value={smtp.from}
              onChange={e => setSmtp(s => ({ ...s, from: e.target.value }))}
              placeholder="notificaciones@miestudio.com"
              className={INPUT}
            />
          </div>
          <div className="col-span-2">
            <SecretInput
              label="Contraseña SMTP"
              value={smtp.password}
              onChange={v => setSmtp(s => ({ ...s, password: v }))}
              placeholder="App password o contraseña SMTP"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSmtp}
            disabled={savingSmtp}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {savingSmtp ? "Guardando..." : "Guardar SMTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
