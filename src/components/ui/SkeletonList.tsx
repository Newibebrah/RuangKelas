"use client";

const bar = "rounded bg-gradient-to-r from-border/40 via-border/70 to-border/40 dark:from-slate-700/40 dark:via-slate-600/60 dark:to-slate-700/40 bg-[length:200%_100%] animate-shimmer";

interface SkeletonListProps {
  items?: number;
  className?: string;
}

export function SkeletonList({ items = 3, className = "" }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${bar} shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-1/2 ${bar}`} />
            <div className={`h-3 w-1/4 ${bar}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
