export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-card rounded-xl border border-border overflow-hidden">
      {/* Header skeleton */}
      <div className="h-10 bg-surface border-b border-border" />
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 border-b border-border last:border-0 animate-pulse px-4 flex items-center gap-4"
          style={{ opacity: 1 - i * 0.1 }}
        >
          <div className="h-3 rounded-full bg-neutral-border flex-[2]" />
          <div className="h-3 rounded-full bg-neutral-border flex-1" />
          <div className="h-3 rounded-full bg-neutral-border flex-1" />
          <div className="h-3 rounded-full bg-neutral-border w-20" />
        </div>
      ))}
    </div>
  );
}

export function LoadingCard({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-32 bg-neutral-bg rounded-xl border border-border animate-pulse"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

export function LoadingMetrics({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-28 bg-neutral-bg rounded-xl border border-border animate-pulse"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}
