import { Inbox, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void } | React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  const isNode = action !== null && typeof action === "object" && "label" in (action as object) === false;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-neutral-bg border border-border rounded-xl flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-text-tertiary" />
      </div>
      <p className="text-md font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="text-sm text-text-muted mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {isNode ? (
            action as React.ReactNode
          ) : (
            <button
              onClick={(action as { label: string; onClick: () => void }).onClick}
              className="text-sm text-info-text hover:text-brand-700 font-medium border border-info-border px-4 py-2 rounded-lg bg-info-bg transition-colors"
            >
              {(action as { label: string; onClick: () => void }).label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
