import { ToastProvider } from "@/components/ui/ToastProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ToastProvider>
  );
}
