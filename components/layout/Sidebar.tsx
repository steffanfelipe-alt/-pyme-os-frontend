"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  GitBranch,
  BarChart2,
  Mail,
  Settings,
  LogOut,
  FileText,
  Zap,
  BookOpen,
  Bot,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useAlertas } from "@/hooks/useAlertas";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function useNavGroups(urgentCount: number): NavGroup[] {
  return [
    {
      label: "Principal",
      items: [
        { href: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
        { href: "/clientes", icon: Users, label: "Clientes" },
        { href: "/onboarding", icon: Rocket, label: "Onboarding" },
      ],
    },
    {
      label: "Trabajo",
      items: [
        { href: "/tareas", icon: CheckSquare, label: "Tareas" },
        { href: "/procesos", icon: GitBranch, label: "Procesos" },
        { href: "/vencimientos", icon: Calendar, label: "Vencimientos", badge: urgentCount },
        { href: "/emails", icon: Mail, label: "Emails" },
      ],
    },
    {
      label: "Inteligencia",
      items: [
        { href: "/automatizaciones", icon: Zap, label: "Automatizaciones" },
        { href: "/conocimiento", icon: BookOpen, label: "Conocimiento" },
        { href: "/facturacion", icon: FileText, label: "Facturación" },
        { href: "/reportes", icon: BarChart2, label: "Reportes" },
      ],
    },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { resumen } = useAlertas();

  const urgentCount = (resumen?.criticas ?? 0) + (resumen?.advertencias ?? 0);
  const navGroups = useNavGroups(urgentCount);

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
    <aside className="w-[220px] bg-brand-900 flex flex-col shrink-0 h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border-sidebar">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold tracking-tight">PO</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-tight">PyME OS</p>
            <p className="text-2xs text-slate-500">Gestión contable</p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto sidebar-scroll">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-2xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, exact, badge }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                      active
                        ? "bg-brand-950 text-blue-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="bg-danger-strong text-white text-2xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border-sidebar px-2 py-3 space-y-0.5">
        <Link
          href="/configuracion"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith("/configuracion")
              ? "bg-brand-950 text-blue-300"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          )}
        >
          <Settings className="h-4 w-4 text-slate-500" />
          Configuración
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>

        {/* User pill */}
        {user && (
          <div className="flex items-center gap-2 px-2 py-2 mt-1 border-t border-border-sidebar pt-3">
            <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-2xs font-semibold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">
                {user.nombre ?? user.email}
              </p>
              <p className="text-2xs text-slate-600 capitalize">{user.rol}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
