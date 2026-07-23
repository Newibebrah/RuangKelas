"use client";

interface SkeletonCardProps {
  rows?: number;
  className?: string;
}

export function SkeletonCard({ rows = 1, className = "" }: SkeletonCardProps) {
  return (
    <div className={`rounded-xl border border-border/60 bg-surface p-4 space-y-3 animate-pulse shadow-sm ${className}`}>
      <div className="h-4 w-1/3 rounded bg-gradient-to-r from-border/40 via-border/70 to-border/40 dark:from-slate-700/40 dark:via-slate-600/60 dark:to-slate-700/40 bg-[length:200%_100%] animate-shimmer" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 rounded bg-gradient-to-r from-border/40 via-border/70 to-border/40 dark:from-slate-700/40 dark:via-slate-600/60 dark:to-slate-700/40 bg-[length:200%_100%] animate-shimmer" />
      ))}
    </div>
  );
}
