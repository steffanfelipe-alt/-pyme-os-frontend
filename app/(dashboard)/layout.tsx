import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AgentChat } from "@/components/chat/AgentChat";
import { ToastProvider } from "@/components/ui/ToastProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-surface overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        {/* AgentChat dashboard: métricas y gestión */}
        <AgentChat mode="dashboard" />
        {/* ChatbotInterno: consultor contable-fiscal */}
        <AgentChat
          mode="assistant"
          placeholder="Consultá sobre impuestos, AFIP, categorías..."
          buttonPosition="fixed bottom-6 right-24"
          panelPosition="fixed bottom-6 right-24"
        />
      </div>
    </ToastProvider>
  );
}
