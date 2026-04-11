"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Inbox, Archive, AlertOctagon, Send, RefreshCw,
  CheckCircle2, Edit3, Tag, X, Clock,
} from "lucide-react";
import { emailsApi, type EmailEntrante } from "@/lib/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

// ─── Secciones (basadas en estado / condición) ────────────────────────────────

const SECCIONES = [
  { id: "sin_leer", label: "Sin leer", icon: Inbox, apiParam: { estado: "no_leido" } },
  { id: "aprobacion_ia", label: "Aprobación IA", icon: Clock, apiParam: { pendiente_aprobacion: true } },
  { id: "respondidos", label: "Respondidos", icon: Send, apiParam: { estado: "respondido" } },
  { id: "archivados", label: "Archivados", icon: Archive, apiParam: { estado: "archivado" } },
  { id: "spam", label: "Spam", icon: AlertOctagon, apiParam: { estado: "spam" } },
] as const;

type SeccionId = (typeof SECCIONES)[number]["id"];

// ─── Categorías (tipos de email) ─────────────────────────────────────────────

const CATEGORIAS: Record<string, { label: string; dot: string; chip: string }> = {
  documento_recibido:  { label: "Documento",          dot: "bg-blue-500",   chip: "bg-blue-100 text-blue-700" },
  consulta_fiscal:     { label: "Consulta fiscal",    dot: "bg-purple-500", chip: "bg-purple-100 text-purple-700" },
  postulacion_laboral: { label: "Postulación",        dot: "bg-green-500",  chip: "bg-green-100 text-green-700" },
  solicitud_licencia:  { label: "Licencia",           dot: "bg-teal-500",   chip: "bg-teal-100 text-teal-700" },
  consulta_interna:    { label: "Interno",            dot: "bg-gray-400",   chip: "bg-gray-100 text-gray-700" },
  proveedor:           { label: "Proveedor",          dot: "bg-amber-500",  chip: "bg-amber-100 text-amber-700" },
  notificacion_afip:   { label: "AFIP",               dot: "bg-red-500",    chip: "bg-red-100 text-red-700" },
  urgente:             { label: "Urgente",            dot: "bg-orange-500", chip: "bg-orange-100 text-orange-700" },
  propuesta_comercial: { label: "Propuesta",          dot: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-700" },
  reclamo:             { label: "Reclamo",            dot: "bg-rose-500",   chip: "bg-rose-100 text-rose-700" },
  spam:                { label: "Spam",               dot: "bg-gray-300",   chip: "bg-gray-100 text-gray-400" },
  otro:                { label: "Otro",               dot: "bg-gray-300",   chip: "bg-gray-100 text-gray-500" },
};

const URGENCIA_DOT: Record<string, string> = {
  alta: "bg-red-500", media: "bg-amber-400", baja: "bg-gray-300",
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function EmailsPage() {
  const [seccion, setSeccion] = useState<SeccionId>("sin_leer");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailEntrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<EmailEntrante | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [editandoRespuesta, setEditandoRespuesta] = useState(false);
  const [accion, setAccion] = useState<string | null>(null);
  const [cambiandoCategoria, setCambiandoCategoria] = useState(false);

  const seccionActual = SECCIONES.find((s) => s.id === seccion)!;

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 100 };
      const apiParam = seccionActual.apiParam as any;
      if (apiParam.estado) params.estado = apiParam.estado;
      if (apiParam.pendiente_aprobacion) params.pendiente_aprobacion = true;
      if (categoriaFiltro) params.categoria = categoriaFiltro;
      const data = await emailsApi.listar(params);
      setEmails(data);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [seccion, categoriaFiltro]);

  useEffect(() => {
    setSeleccionado(null);
    cargar();
  }, [cargar]);

  const abrirEmail = async (email: EmailEntrante) => {
    try {
      const det = await emailsApi.obtener(email.id);
      setSeleccionado(det);
      setRespuestaTexto(det.borrador_editado ?? det.borrador_respuesta ?? "");
      setEditandoRespuesta(false);
    } catch {
      setSeleccionado(email);
    }
  };

  const handleAprobar = async () => {
    if (!seleccionado) return;
    setAccion("aprobando");
    try {
      await emailsApi.aprobarRespuesta(seleccionado.id);
      await cargar();
      setSeleccionado(null);
    } catch (e: any) {
      alert(e.message ?? "Error al aprobar");
    } finally { setAccion(null); }
  };

  const handleEnviarEditado = async () => {
    if (!seleccionado || !respuestaTexto.trim()) return;
    setAccion("enviando");
    try {
      await emailsApi.editarYEnviar(seleccionado.id, respuestaTexto);
      await cargar();
      setSeleccionado(null);
    } catch (e: any) {
      alert(e.message ?? "Error al enviar");
    } finally { setAccion(null); }
  };

  const handleArchivar = async (id: number) => {
    setAccion("archivando");
    try {
      await emailsApi.archivar(id);
      await cargar();
      setSeleccionado(null);
    } finally { setAccion(null); }
  };

  const handleCambiarCategoria = async (id: number, categoria: string) => {
    try {
      await emailsApi.cambiarCategoria(id, categoria);
      setEmails((prev) => prev.map((e) => e.id === id ? { ...e, categoria } : e));
      if (seleccionado?.id === id) setSeleccionado({ ...seleccionado, categoria });
      setCambiandoCategoria(false);
    } catch (e: any) {
      alert(e.message ?? "Error al cambiar categoría");
    }
  };

  const sinLeerCount = seccion === "sin_leer" ? emails.length : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bandeja de emails"
        description="Emails entrantes clasificados automáticamente por IA"
      />

      <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[500px]">

        {/* ── Sidebar izquierdo ── */}
        <div className="w-44 shrink-0 flex flex-col gap-4">

          {/* Secciones (por estado) */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              Bandeja
            </p>
            {SECCIONES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setSeccion(id); setCategoriaFiltro(null); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  seccion === id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {id === "sin_leer" && sinLeerCount !== undefined && sinLeerCount > 0 && (
                  <span className="text-[10px] font-bold bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {sinLeerCount > 9 ? "9+" : sinLeerCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Categorías (tipos de email — filtran dentro de la sección) */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
              Categoría
            </p>
            <button
              onClick={() => setCategoriaFiltro(null)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                categoriaFiltro === null ? "bg-gray-100 text-gray-800" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              Todas
            </button>
            {Object.entries(CATEGORIAS)
              .filter(([id]) => !["spam", "otro"].includes(id))
              .map(([id, meta]) => (
                <button
                  key={id}
                  onClick={() => setCategoriaFiltro(id === categoriaFiltro ? null : id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
                    categoriaFiltro === id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", meta.dot)} />
                  {meta.label}
                </button>
              ))}
          </div>
        </div>

        {/* ── Lista de emails ── */}
        <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-700">{seccionActual.label}</p>
              {categoriaFiltro && (
                <button
                  onClick={() => setCategoriaFiltro(null)}
                  className="flex items-center gap-1 text-[10px] text-blue-600 mt-0.5"
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", CATEGORIAS[categoriaFiltro]?.dot)} />
                  {CATEGORIAS[categoriaFiltro]?.label}
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">{emails.length}</span>
              <button onClick={cargar} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="space-y-2 p-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Mail className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Sin emails aquí</p>
              </div>
            ) : (
              emails.map((email) => {
                const catMeta = CATEGORIAS[email.categoria ?? "otro"] ?? CATEGORIAS.otro;
                const esSeleccionado = seleccionado?.id === email.id;
                return (
                  <button
                    key={email.id}
                    onClick={() => abrirEmail(email)}
                    className={cn(
                      "w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors",
                      esSeleccionado && "bg-blue-50",
                      email.estado === "no_leido" && "font-semibold"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
                        URGENCIA_DOT[email.urgencia ?? "baja"]
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {email.remitente.split("<")[0].trim() || email.remitente}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {email.asunto || "(Sin asunto)"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", catMeta.chip)}>
                            {catMeta.label}
                          </span>
                          {email.tiene_adjuntos && (
                            <span className="text-[10px] text-gray-400">📎</span>
                          )}
                          {email.requiere_respuesta && !email.borrador_aprobado && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">
                              Requiere aprobación
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Detalle del email ── */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col min-w-0">
          {seleccionado ? (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-gray-900 leading-tight">
                      {seleccionado.asunto || "(Sin asunto)"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      De: <span className="font-medium text-gray-700">{seleccionado.remitente}</span>
                    </p>
                  </div>
                  <button onClick={() => setSeleccionado(null)} className="p-1 hover:bg-gray-100 rounded shrink-0">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {/* Badges + acciones */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {/* Cambio de categoría */}
                  <div className="relative">
                    <button
                      onClick={() => setCambiandoCategoria((v) => !v)}
                      className={cn(
                        "flex items-center gap-1 text-[11px] px-2 py-1 rounded-full font-medium cursor-pointer hover:opacity-80",
                        CATEGORIAS[seleccionado.categoria ?? "otro"]?.chip ?? "bg-gray-100 text-gray-600"
                      )}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {CATEGORIAS[seleccionado.categoria ?? "otro"]?.label ?? "Otro"}
                    </button>
                    {cambiandoCategoria && (
                      <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-1 w-52 max-h-72 overflow-y-auto">
                        {Object.entries(CATEGORIAS).map(([id, meta]) => (
                          <button
                            key={id}
                            onClick={() => handleCambiarCategoria(seleccionado.id, id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg hover:bg-gray-50 text-left",
                              seleccionado.categoria === id && "bg-blue-50 text-blue-700"
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", meta.dot)} />
                            {meta.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {seleccionado.urgencia && (
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      seleccionado.urgencia === "alta" ? "bg-red-100 text-red-700" :
                      seleccionado.urgencia === "media" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-500"
                    )}>
                      {seleccionado.urgencia.toUpperCase()}
                    </span>
                  )}

                  {seleccionado.requiere_revision_manual && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                      Revisión manual
                    </span>
                  )}

                  <div className="ml-auto">
                    <button
                      onClick={() => handleArchivar(seleccionado.id)}
                      disabled={!!accion}
                      className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Archive className="h-3 w-3" />
                      Archivar
                    </button>
                  </div>
                </div>

                {seleccionado.resumen && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-[11px] font-semibold text-blue-700 mb-0.5">Resumen IA</p>
                    <p className="text-xs text-blue-800">{seleccionado.resumen}</p>
                  </div>
                )}
              </div>

              {/* Cuerpo */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {seleccionado.cuerpo_texto ? (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                    {seleccionado.cuerpo_texto}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin cuerpo de texto disponible</p>
                )}
              </div>

              {/* Sección de respuesta */}
              {seleccionado.requiere_respuesta && (
                <div className="border-t border-gray-100 p-4 space-y-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">
                      {seleccionado.borrador_aprobado ? "Respuesta enviada" : "Borrador de respuesta (IA)"}
                    </p>
                    {!seleccionado.borrador_aprobado && (
                      <button
                        onClick={() => setEditandoRespuesta((v) => !v)}
                        className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="h-3 w-3" />
                        {editandoRespuesta ? "Ver borrador" : "Editar"}
                      </button>
                    )}
                  </div>

                  {editandoRespuesta ? (
                    <textarea
                      value={respuestaTexto}
                      onChange={(e) => setRespuestaTexto(e.target.value)}
                      rows={5}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 resize-none"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                      {respuestaTexto || seleccionado.borrador_respuesta || "Sin borrador disponible"}
                    </div>
                  )}

                  {!seleccionado.borrador_aprobado && (
                    <div className="flex gap-2">
                      {!editandoRespuesta ? (
                        <button
                          onClick={handleAprobar}
                          disabled={!!accion || seleccionado.requiere_revision_manual}
                          className="flex items-center gap-1.5 flex-1 justify-center py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {accion === "aprobando" ? "Aprobando..." : "Aprobar y enviar"}
                        </button>
                      ) : (
                        <button
                          onClick={handleEnviarEditado}
                          disabled={!!accion || !respuestaTexto.trim()}
                          className="flex items-center gap-1.5 flex-1 justify-center py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {accion === "enviando" ? "Enviando..." : "Enviar editado"}
                        </button>
                      )}
                    </div>
                  )}

                  {seleccionado.requiere_revision_manual && !editandoRespuesta && (
                    <p className="text-[10px] text-orange-600">
                      Revisión manual requerida — editá la respuesta antes de enviar.
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Mail className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Seleccioná un email para verlo</p>
              <p className="text-xs mt-1 opacity-70">Los emails se clasifican automáticamente con IA</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
