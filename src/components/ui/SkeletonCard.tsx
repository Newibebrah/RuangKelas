"use client";

interface SkeletonCardProps {
  rows?: number;
  className?: string;
}

export function SkeletonCard({ rows = 1, className = "" }: SkeletonCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 space-y-3 animate-pulse ${className}`}>
      <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  );
}
