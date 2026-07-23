import { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
  className?: string;
  pulse?: boolean;
}

const variants: Record<string, string> = {
  default: "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-primary-200/50 dark:ring-primary-700/30",
  success: "bg-success-light dark:bg-success/10 text-success dark:text-emerald-400 ring-success/20 dark:ring-success/30",
  warning: "bg-warning-light dark:bg-warning/10 text-warning dark:text-amber-400 ring-warning/20 dark:ring-warning/30",
  danger: "bg-danger-light dark:bg-danger/10 text-danger dark:text-red-400 ring-danger/20 dark:ring-danger/30",
  info: "bg-info-light dark:bg-info/10 text-info dark:text-blue-400 ring-info/20 dark:ring-info/30",
};

export function Badge({ variant = "default", children, className = "", pulse = false }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full ring-1 ${variants[variant]} ${
        pulse ? "animate-pulse-subtle" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}
