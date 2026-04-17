"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Settings, User, FileText, DollarSign, CreditCard, Users,
  Bell, Calendar, Link2, Globe, Shield, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECCIONES = [
  { href: "/configuracion/perfil", label: "Perfil del estudio", icon: User },
  { href: "/configuracion/facturacion", label: "Facturación (AFIP)", icon: FileText },
  { href: "/configuracion/honorarios", label: "Honorarios y tarifas", icon: DollarSign },
  { href: "/configuracion/cobranza", label: "Abonos y cobranza", icon: CreditCard },
  { href: "/configuracion/equipo", label: "Equipo y roles", icon: Users },
  { href: "/configuracion/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/configuracion/calendario", label: "Calendario fiscal", icon: Calendar },
  { href: "/configuracion/integraciones", label: "Integraciones", icon: Link2 },
  { href: "/configuracion/portal", label: "Portal del cliente", icon: Globe },
  { href: "/configuracion/seguridad", label: "Seguridad", icon: Shield },
  { href: "/configuracion/sistema", label: "Sistema", icon: Cpu },
];

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 py-6">
        <div className="px-4 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Configuración</span>
        </div>
        <nav className="space-y-0.5 px-2">
          {SECCIONES.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
