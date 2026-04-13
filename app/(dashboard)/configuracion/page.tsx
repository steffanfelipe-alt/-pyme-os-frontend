"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  Settings, Save, Loader2, CheckCircle2, Upload, AlertCircle, Users,
  Key, Eye, EyeOff, MessageSquare, Bot, Mail, Link2, RefreshCw,
  Send, Wifi, WifiOff, FileKey,
} from "lucide-react";
import {
  reportesApi, clientesApi, configuracionApi, emailsApi, facturacionApi,
  type ApiKeysConfigFull,
} from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-gray-300 bg-white";

// ─── Campo de API Key enmascarado ────────────────────────────────────────────
function SecretInput({
  label, value, onChange, placeholder, hint, envConfigured,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; envConfigured?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isMasked = value.startsWith("••••");
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        {envConfigured && (
          <span className="text-[10px] text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded font-medium">
            via env
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={isMasked ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isMasked ? "••••••••••••  (configurado)" : placeholder}
          className={cn(inputCls, "pr-10")}
          autoComplete="off"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Botón de guardar con feedback ──────────────────────────────────────────
function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 justify-end mt-5">
      {saved && (
        <span className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" /> Guardado
        </span>
      )}
      <button onClick={onClick} disabled={saving}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Datos del estudio ──
  const [estudio, setEstudio] = useState({ nombre_estudio: "", tarifa_hora_pesos: 0, moneda: "ARS" });
  const [savingEstudio, setSavingEstudio] = useState(false);
  const [savedEstudio, setSavedEstudio] = useState(false);

  // ── Telegram ──
  const [tg, setTg] = useState({ token: "", webhook_url: "" });
  const [tgMeta, setTgMeta] = useState({ token_env: false });
  const [savingTg, setSavingTg] = useState(false);
  const [savedTg, setSavedTg] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{ url: string; pending_updates: number; last_error: string | null } | null>(null);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [codigo, setCodigo] = useState<{ codigo: string; expira_en_minutos: number } | null>(null);

  // ── Gmail ──
  const [gmail, setGmail] = useState<{ conectado: boolean; gmail_address?: string; watch_expiry?: string } | null>(null);
  const [loadingGmail, setLoadingGmail] = useState(false);
  const [conectandoGmail, setConectandoGmail] = useState(false);
  const [studioEmail, setStudioEmail] = useState("");

  // ── ARCA/AFIP ──
  const [arca, setArca] = useState({
    cuit: "", punto_venta: "", modo: "homologacion",
    certificado_b64: "", clave_privada_b64: "",
  });
  const [arcaConfigurado, setArcaConfigurado] = useState(false);
  const [savingArca, setSavingArca] = useState(false);
  const [savedArca, setSavedArca] = useState(false);

  // ── Anthropic ──
  const [anthropic, setAnthropic] = useState({ api_key: "" });
  const [anthropicEnv, setAnthropicEnv] = useState(false);
  const [savingAnthropic, setSavingAnthropic] = useState(false);
  const [savedAnthropic, setSavedAnthropic] = useState(false);

  // ── SMTP ──
  const [smtp, setSmtp] = useState({ host: "", port: "", user: "", password: "", from: "" });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savedSmtp, setSavedSmtp] = useState(false);

  // ── CSV ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [importResult, setImportResult] = useState<{ importados: number; errores: number; detalle?: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // ── Carga inicial ──
  useEffect(() => {
    Promise.all([
      reportesApi.config(),
      configuracionApi.getApiKeys().catch(() => null),
      emailsApi.estadoGmail().catch(() => null),
      facturacionApi.obtenerConfig().catch(() => null),
    ]).then(([cfg, keys, gmailStatus, arcaConfig]) => {
      setEstudio({
        nombre_estudio: cfg.nombre_estudio ?? "",
        tarifa_hora_pesos: cfg.tarifa_hora_pesos ?? 0,
        moneda: cfg.moneda ?? "ARS",
      });
      if (keys) {
        setTg({
          token: keys.telegram_bot_token ?? "",
          webhook_url: keys.telegram_webhook_url ?? "",
        });
        setTgMeta({ token_env: keys.telegram_bot_token_env });
        setAnthropic({ api_key: keys.anthropic_api_key ?? "" });
        setAnthropicEnv(keys.anthropic_api_key_env);
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
      if (arcaConfig) {
        setArca((p) => ({
          ...p,
          cuit: arcaConfig.cuit ?? "",
          punto_venta: arcaConfig.punto_venta?.toString() ?? "",
          modo: arcaConfig.modo ?? "homologacion",
        }));
        setArcaConfigurado(arcaConfig.configurado ?? false);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // ── Detectar callback OAuth de Gmail ──
  useEffect(() => {
    const code = searchParams.get("code");
    const scope = searchParams.get("scope");
    if (code && scope?.includes("gmail")) {
      setConectandoGmail(true);
      const redirect_uri = window.location.origin + "/configuracion";
      emailsApi.completarOAuthGmail(code, redirect_uri, studioEmail || "studio")
        .then((res) => {
          setGmail({ conectado: true, gmail_address: res.gmail_address });
          router.replace("/configuracion");
        })
        .catch((e: any) => toast.error(e.message ?? "Error al conectar Gmail"))
        .finally(() => setConectandoGmail(false));
    }
  }, [searchParams]);

  // ── Handlers ──
  const handleSaveEstudio = async () => {
    setSavingEstudio(true);
    await reportesApi.actualizarConfig(estudio).catch(() => {});
    setSavingEstudio(false); setSavedEstudio(true);
    setTimeout(() => setSavedEstudio(false), 2500);
  };

  const handleSaveTg = async () => {
    setSavingTg(true);
    const payload: any = { telegram_webhook_url: tg.webhook_url };
    if (tg.token && !tg.token.startsWith("••••")) payload.telegram_bot_token = tg.token;
    const updated = await configuracionApi.updateApiKeys(payload).catch(() => null);
    if (updated) {
      setTg((p) => ({ ...p, token: updated.telegram_bot_token ?? "", webhook_url: updated.telegram_webhook_url ?? "" }));
      setTgMeta({ token_env: updated.telegram_bot_token_env });
    }
    setSavingTg(false); setSavedTg(true);
    setTimeout(() => setSavedTg(false), 2500);
  };

  const handleRegistrarWebhook = async () => {
    setRegistrando(true);
    setWebhookInfo(null);
    try {
      await configuracionApi.registrarWebhookTelegram();
      const info = await configuracionApi.infoWebhookTelegram();
      setWebhookInfo(info);
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
      const redirect_uri = window.location.origin + "/configuracion";
      const { auth_url } = await emailsApi.iniciarOAuthGmail(redirect_uri);
      window.location.href = auth_url;
    } catch (e: any) {
      toast.error(e.message ?? "Error iniciando OAuth");
      setLoadingGmail(false);
    }
  };

  const handleDesconectarGmail = async () => {
    await emailsApi.desconectarGmail().catch(() => {});
    setGmail({ conectado: false });
    toast.success("Gmail desconectado");
  };

  const handleSaveArca = async () => {
    if (!arca.cuit || !arca.punto_venta) {
      toast.error("CUIT y punto de venta son obligatorios");
      return;
    }
    setSavingArca(true);
    try {
      const payload: Parameters<typeof facturacionApi.guardarConfig>[0] = {
        cuit: arca.cuit,
        punto_venta: parseInt(arca.punto_venta) || 1,
        certificado_b64: arca.certificado_b64,
        clave_privada_b64: arca.clave_privada_b64,
        modo: arca.modo,
      };
      // No enviar certs vacíos si ya hay config guardada
      if (!arca.certificado_b64 && arcaConfigurado) delete (payload as any).certificado_b64;
      if (!arca.clave_privada_b64 && arcaConfigurado) delete (payload as any).clave_privada_b64;
      await facturacionApi.guardarConfig(payload);
      setArcaConfigurado(true);
      setSavedArca(true);
      setTimeout(() => setSavedArca(false), 2500);
    } catch (e: any) {
      toast.error(e.message ?? "Error guardando config ARCA");
    } finally {
      setSavingArca(false);
    }
  };

  const handleSaveAnthropic = async () => {
    setSavingAnthropic(true);
    const payload: any = {};
    if (anthropic.api_key && !anthropic.api_key.startsWith("••••")) payload.anthropic_api_key = anthropic.api_key;
    const updated = await configuracionApi.updateApiKeys(payload).catch(() => null);
    if (updated) setAnthropic({ api_key: updated.anthropic_api_key ?? "" });
    setSavingAnthropic(false); setSavedAnthropic(true);
    setTimeout(() => setSavedAnthropic(false), 2500);
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    const payload: any = {
      smtp_host: smtp.host || null,
      smtp_port: smtp.port ? parseInt(smtp.port) : null,
      smtp_user: smtp.user || null,
      smtp_from: smtp.from || null,
    };
    if (smtp.password && !smtp.password.startsWith("••••")) payload.smtp_password = smtp.password;
    const updated = await configuracionApi.updateApiKeys(payload).catch(() => null);
    if (updated) setSmtp({
      host: updated.smtp_host ?? "",
      port: updated.smtp_port?.toString() ?? "",
      user: updated.smtp_user ?? "",
      password: updated.smtp_password ?? "",
      from: updated.smtp_from ?? "",
    });
    setSavingSmtp(false); setSavedSmtp(true);
    setTimeout(() => setSavedSmtp(false), 2500);
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true); setImportResult(null); setImportError(null);
    try {
      const result = await clientesApi.importarCsv(file);
      setImportResult({
        importados: result.importados ?? result.clientes_importados ?? 0,
        errores: result.errores ?? 0,
        detalle: result.detalle_errores ?? result.detalle ?? [],
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-gray-100 rounded" />
        {[...Array(5)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Configuración" description="Ajustes e integraciones del estudio" />

      {/* ── 1. Datos del estudio ── */}
      <Section icon={<Settings className="h-4 w-4 text-gray-400" />} title="Datos del estudio">
        <div className="space-y-4">
          <Field label="Nombre del estudio">
            <input value={estudio.nombre_estudio}
              onChange={(e) => setEstudio((p) => ({ ...p, nombre_estudio: e.target.value }))}
              placeholder="Estudio Contable XYZ" className={inputCls} />
          </Field>
          <Field label="Tarifa hora (ARS)" hint="Usada para calcular rentabilidad por cliente">
            <input type="number" value={estudio.tarifa_hora_pesos}
              onChange={(e) => setEstudio((p) => ({ ...p, tarifa_hora_pesos: Number(e.target.value) }))}
              min={0} placeholder="5000" className={inputCls} />
          </Field>
          <Field label="Moneda">
            <select value={estudio.moneda} onChange={(e) => setEstudio((p) => ({ ...p, moneda: e.target.value }))} className={inputCls}>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="USD">USD — Dólar estadounidense</option>
            </select>
          </Field>
        </div>
        <SaveButton onClick={handleSaveEstudio} saving={savingEstudio} saved={savedEstudio} />
      </Section>

      {/* ── 2. Telegram ── */}
      <Section icon={<MessageSquare className="h-4 w-4 text-blue-500" />} title="Telegram Bot" color="blue">
        <div className="space-y-4">
          <SecretInput
            label="Token del bot"
            value={tg.token}
            onChange={(v) => setTg((p) => ({ ...p, token: v }))}
            placeholder="123456789:AABBccDD..."
            hint="Obtenelo en @BotFather → /newbot o /token"
            envConfigured={tgMeta.token_env}
          />
          <Field label="URL del webhook" hint="Pegá la URL de ngrok (o tu dominio). El bot la usa para recibir mensajes.">
            <div className="flex gap-2">
              <input
                value={tg.webhook_url}
                onChange={(e) => setTg((p) => ({ ...p, webhook_url: e.target.value }))}
                placeholder="https://xxxx.ngrok-free.app"
                className={inputCls}
              />
              <button
                onClick={handleRegistrarWebhook}
                disabled={registrando || !tg.webhook_url}
                title="Guardar y registrar webhook en Telegram"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {registrando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {registrando ? "..." : "Registrar"}
              </button>
            </div>
            {webhookInfo && (
              <div className={cn(
                "mt-2 p-2.5 rounded-lg text-xs border",
                webhookInfo.last_error ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
              )}>
                {webhookInfo.last_error
                  ? `Error: ${webhookInfo.last_error}`
                  : `✓ Webhook activo — ${webhookInfo.url}`}
                {webhookInfo.pending_updates > 0 && (
                  <span className="ml-2 text-amber-600">({webhookInfo.pending_updates} mensajes pendientes)</span>
                )}
              </div>
            )}
          </Field>

          {/* Generar código de vinculación */}
          <div className="pt-3 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-800">Vincular tu cuenta</p>
                <p className="text-[11px] text-blue-500 mt-0.5">
                  Generá un código y mandalo al bot: <code className="bg-blue-100 px-1 rounded">/vincular CODIGO</code>
                </p>
              </div>
              <button
                onClick={handleGenerarCodigo}
                disabled={generandoCodigo}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 shrink-0"
              >
                {generandoCodigo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                Generar código
              </button>
            </div>
            {codigo && (
              <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg text-center">
                <p className="text-[11px] text-blue-400 mb-1">Expira en {codigo.expira_en_minutos} min</p>
                <p className="font-mono text-2xl font-bold text-blue-700 tracking-[0.3em]">{codigo.codigo}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Enviá al bot: <code className="bg-gray-100 px-1 rounded">/vincular {codigo.codigo}</code>
                </p>
              </div>
            )}
          </div>
        </div>
        <SaveButton onClick={handleSaveTg} saving={savingTg} saved={savedTg} />
      </Section>

      {/* ── 3. Gmail ── */}
      <Section icon={<Mail className="h-4 w-4 text-red-500" />} title="Gmail" color="red">
        {conectandoGmail ? (
          <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Completando conexión con Google...
          </div>
        ) : gmail?.conectado ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Conectado</p>
                  <p className="text-xs text-green-600">{gmail.gmail_address}</p>
                </div>
              </div>
              <button
                onClick={handleDesconectarGmail}
                className="text-xs text-red-500 hover:text-red-700 hover:underline"
              >
                Desconectar
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              PyME OS recibe emails entrantes en tiempo real y puede responder en nombre del estudio.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <WifiOff className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-500">Gmail no conectado</p>
            </div>
            <Field label="Email del estudio" hint="El email que identificará la conexión en el sistema">
              <input
                value={studioEmail}
                onChange={(e) => setStudioEmail(e.target.value)}
                placeholder="miestudio@gmail.com"
                className={inputCls}
              />
            </Field>
            <button
              onClick={handleConectarGmail}
              disabled={loadingGmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              {loadingGmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {loadingGmail ? "Redirigiendo a Google..." : "Conectar con Google OAuth"}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              Necesitás configurar <code className="bg-gray-100 px-1 rounded">GOOGLE_CLIENT_ID</code> y{" "}
              <code className="bg-gray-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code> en el .env del backend.
            </p>
          </div>
        )}
      </Section>

      {/* ── 4. ARCA / AFIP ── */}
      <Section icon={<FileKey className="h-4 w-4 text-emerald-600" />} title="ARCA / AFIP (Facturación electrónica)" color="emerald">
        <div className="space-y-4">
          {arcaConfigurado && (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> ARCA configurado — CUIT {arca.cuit} · PV {arca.punto_venta}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="CUIT del estudio">
              <input value={arca.cuit} onChange={(e) => setArca((p) => ({ ...p, cuit: e.target.value }))}
                placeholder="20-12345678-9" className={inputCls} />
            </Field>
            <Field label="Punto de venta">
              <input type="number" value={arca.punto_venta}
                onChange={(e) => setArca((p) => ({ ...p, punto_venta: e.target.value }))}
                placeholder="1" min={1} className={inputCls} />
            </Field>
          </div>
          <Field label="Modo">
            <select value={arca.modo} onChange={(e) => setArca((p) => ({ ...p, modo: e.target.value }))} className={inputCls}>
              <option value="homologacion">Homologación (pruebas)</option>
              <option value="produccion">Producción</option>
            </select>
          </Field>
          <Field label="Certificado (.pem en base64)" hint="Pegá el contenido del archivo .crt o .pem en base64">
            <textarea
              value={arca.certificado_b64}
              onChange={(e) => setArca((p) => ({ ...p, certificado_b64: e.target.value }))}
              placeholder="LS0tLS1CRUdJTi..."
              rows={3}
              className={cn(inputCls, "font-mono text-xs resize-none")}
            />
          </Field>
          <Field label="Clave privada (.key en base64)" hint="Pegá el contenido del archivo .key en base64">
            <textarea
              value={arca.clave_privada_b64}
              onChange={(e) => setArca((p) => ({ ...p, clave_privada_b64: e.target.value }))}
              placeholder="LS0tLS1CRUdJTi..."
              rows={3}
              className={cn(inputCls, "font-mono text-xs resize-none")}
            />
          </Field>
        </div>
        <SaveButton onClick={handleSaveArca} saving={savingArca} saved={savedArca} />
      </Section>

      {/* ── 5. Anthropic (IA) ── */}
      <Section icon={<Bot className="h-4 w-4 text-purple-500" />} title="Anthropic (IA)" color="purple">
        <SecretInput
          label="API Key"
          value={anthropic.api_key}
          onChange={(v) => setAnthropic({ api_key: v })}
          placeholder="sk-ant-api03-..."
          hint="Necesaria para el asistente de IA y el chat del dashboard"
          envConfigured={anthropicEnv}
        />
        <SaveButton onClick={handleSaveAnthropic} saving={savingAnthropic} saved={savedAnthropic} />
      </Section>

      {/* ── 6. SMTP / Email saliente ── */}
      <Section icon={<Send className="h-4 w-4 text-gray-500" />} title="Correo saliente (SMTP)">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Host SMTP">
              <input value={smtp.host} onChange={(e) => setSmtp((p) => ({ ...p, host: e.target.value }))}
                placeholder="smtp.gmail.com" className={inputCls} />
            </Field>
            <Field label="Puerto">
              <input type="number" value={smtp.port} onChange={(e) => setSmtp((p) => ({ ...p, port: e.target.value }))}
                placeholder="587" className={inputCls} />
            </Field>
          </div>
          <Field label="Usuario SMTP">
            <input value={smtp.user} onChange={(e) => setSmtp((p) => ({ ...p, user: e.target.value }))}
              placeholder="usuario@gmail.com" className={inputCls} />
          </Field>
          <SecretInput label="Contraseña SMTP" value={smtp.password} onChange={(v) => setSmtp((p) => ({ ...p, password: v }))}
            placeholder="App password o contraseña SMTP" />
          <Field label="Email remitente (From)">
            <input value={smtp.from} onChange={(e) => setSmtp((p) => ({ ...p, from: e.target.value }))}
              placeholder="notificaciones@miestudio.com" className={inputCls} />
          </Field>
        </div>
        <SaveButton onClick={handleSaveSmtp} saving={savingSmtp} saved={savedSmtp} />
      </Section>

      {/* ── 7. Importar clientes ── */}
      <Section icon={<Users className="h-4 w-4 text-gray-400" />} title="Importar clientes desde CSV">
        <p className="text-xs text-gray-400 mb-4">
          Columnas: <code className="bg-gray-100 px-1 py-0.5 rounded">nombre</code>,{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">cuit_cuil</code>,{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">condicion_fiscal</code> y opcionales{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">email</code>,{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">telefono</code>,{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">honorarios_mensuales</code>.
        </p>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importando}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 w-full justify-center"
        >
          {importando ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando...</> : <><Upload className="h-4 w-4" /> Seleccionar CSV</>}
        </button>
        {importResult && (
          <div className={cn("mt-4 p-3 rounded-lg border", importResult.errores === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200")}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={cn("h-4 w-4", importResult.errores === 0 ? "text-green-600" : "text-amber-600")} />
              <span className={cn("text-sm font-medium", importResult.errores === 0 ? "text-green-800" : "text-amber-800")}>
                {importResult.importados} clientes importados{importResult.errores > 0 && ` · ${importResult.errores} con errores`}
              </span>
            </div>
            {importResult.detalle?.slice(0, 5).map((d, i) => (
              <p key={i} className="text-xs text-amber-700 mt-1">{d}</p>
            ))}
          </div>
        )}
        {importError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-sm text-red-700">{importError}</span>
          </div>
        )}
      </Section>

      {/* Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Sistema</p>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span className="text-gray-400">Versión</span><span>PyME OS v1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Backend</span>
            <span className="font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL ?? "localhost:8000"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function Section({
  icon, title, children, color = "gray",
}: {
  icon: React.ReactNode; title: string; children: React.ReactNode; color?: string;
}) {
  const colors: Record<string, string> = {
    gray: "border-gray-100",
    blue: "border-blue-100",
    red: "border-red-100",
    emerald: "border-emerald-100",
    purple: "border-purple-100",
  };
  return (
    <div className={cn("bg-white rounded-xl border p-6", colors[color] ?? colors.gray)}>
      <h2 className="text-sm font-semibold text-gray-800 mb-5 flex items-center gap-2">
        {icon}{title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
