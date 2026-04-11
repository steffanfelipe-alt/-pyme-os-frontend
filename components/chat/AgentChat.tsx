"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { agentApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Send, Bot, User, Loader2, X, MessageCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggested_actions?: string[];
}

interface AgentChatProps {
  mode?: "dashboard" | "assistant";
  placeholder?: string;
}

const SUGERENCIAS_DEFAULT = [
  "¿Quién tiene más carga?",
  "¿Clientes en riesgo?",
  "¿Vencimientos esta semana?",
  "Resumen del estudio",
];

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Procesar **bold**
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
    );

    // Lista con "-"
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-1.5 mb-0.5">
          <span className="text-blue-400 mt-0.5 shrink-0">•</span>
          <span>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</span>
        </div>
      );
    }

    if (!line.trim()) return <div key={i} className="h-2" />;
    return <div key={i}>{rendered}</div>;
  });
}

export function AgentChat({
  mode = "dashboard",
  placeholder = "Preguntá algo sobre tus clientes...",
}: AgentChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      if (mode === "dashboard") {
        const res = await agentApi.dashboardChat(msg, history, sessionId);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.response,
            suggested_actions: res.suggested_actions?.map((a: any) =>
              typeof a === "string" ? a : a.label ?? a.description ?? JSON.stringify(a)
            ),
          },
        ]);
      } else {
        const res = await agentApi.assistantChat(msg, history, sessionId);
        setMessages((prev) => [...prev, { role: "assistant", content: res.response }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No pude conectarme al servidor. Verificá tu conexión e intentá de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, mode, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center z-40 hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 w-96 h-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">
                {mode === "dashboard" ? "Asistente Dashboard" : "Consultor Contable"}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-blue-500 rounded transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center py-6">
                <Bot className="h-10 w-10 text-blue-200 mb-2" />
                <p className="text-sm text-gray-500 font-medium mb-4">¿En qué te puedo ayudar?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGERENCIAS_DEFAULT.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    )}
                  >
                    {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Suggested actions */}
                {msg.role === "assistant" && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                    {msg.suggested_actions.map((action, j) => (
                      <button
                        key={j}
                        onClick={() => sendMessage(action)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] rounded-full hover:bg-blue-100 transition-colors font-medium border border-blue-100"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                {/* Separador entre turnos */}
                {i < messages.length - 1 && (
                  <div className="border-b border-gray-50 mt-3" />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all placeholder:text-gray-300"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-300 mt-1.5 text-center">
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      )}
    </>
  );
}
