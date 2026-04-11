"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CheckSquare,
  GitBranch,
  BarChart3,
  Mail,
  Settings,
  LogOut,
  FileText,
  Zap,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/vencimientos", icon: CalendarClock, label: "Vencimientos" },
  { href: "/tareas", icon: CheckSquare, label: "Tareas" },
  { href: "/procesos", icon: GitBranch, label: "Procesos" },
  { href: "/automatizaciones", icon: Zap, label: "Automatizaciones" },
  { href: "/conocimiento", icon: BookOpen, label: "Conocimiento" },
  { href: "/facturacion", icon: FileText, label: "Facturación" },
  { href: "/reportes", icon: BarChart3, label: "Reportes" },
  { href: "/emails", icon: Mail, label: "Emails" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    clearToken();
    router.push("/login");
  };

  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">PO</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">PyME OS</p>
            <p className="text-[11px] text-gray-400">Gestión contable</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-blue-600" : "text-gray-400"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + bottom */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <Link
          href="/configuracion"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith("/configuracion")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <Settings className="h-4 w-4 text-gray-400" />
          Configuración
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 text-gray-400" />
          Cerrar sesión
        </button>

        {/* User pill */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-blue-700 text-[11px] font-semibold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">
                {user.nombre ?? user.email}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">{user.rol}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
