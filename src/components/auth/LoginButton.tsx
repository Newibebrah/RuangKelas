"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { HiExclamationCircle } from "react-icons/hi";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginButton() {
  const { t } = useLocale();
  const { signInWithGoogle, loading, error } = useAuth();
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
    signInWithGoogle();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        ref={ref}
        onClick={handleClick}
        disabled={loading}
        className="relative inline-flex items-center justify-center gap-3 px-8 py-3.5 w-full max-w-sm text-base font-semibold rounded-2xl border border-border/70 text-text-secondary bg-surface hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 hover:shadow-lg hover:shadow-primary-500/15 hover:scale-[1.02] dark:hover:bg-primary-900/20 dark:hover:text-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] select-none overflow-hidden transition-all duration-300"
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <GoogleLogo />
        )}
        <span>{loading ? t('common.loading') : t('auth.login')}</span>
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-primary-400/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </button>
      {error && (
        <div className="flex items-start gap-3 max-w-sm p-3.5 bg-danger-light dark:bg-danger/10 rounded-xl border border-danger/20">
          <HiExclamationCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
