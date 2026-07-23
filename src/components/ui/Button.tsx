"use client";

import { ButtonHTMLAttributes, ReactNode, useRef, useState } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }
  };

  const base =
    "relative inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.95] select-none overflow-hidden";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:scale-[1.04] dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500",
    secondary:
      "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10",
    outline:
      "border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:shadow-lg hover:shadow-indigo-500/10",
    ghost:
      "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400",
    danger:
      "bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:scale-[1.04] dark:from-red-500 dark:via-rose-500 dark:to-pink-500",
  };

  const sizes: Record<string, string> = {
    sm: "px-4 py-1.5 text-xs gap-1.5",
    md: "px-6 py-2.5 text-sm gap-2",
    lg: "px-8 py-3.5 text-base gap-2.5",
  };

  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </button>
  );
}
