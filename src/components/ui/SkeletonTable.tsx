"use client";

const bar = "rounded bg-gradient-to-r from-border/40 via-border/70 to-border/40 dark:from-slate-700/40 dark:via-slate-600/60 dark:to-slate-700/40 bg-[length:200%_100%] animate-shimmer";

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }: SkeletonTableProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border/60 animate-pulse ${className}`}>
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-3">
                <div className={`h-3 ${bar}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="p-3">
                  <div className={`h-3 ${bar}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
