"use client";

import type { ReactNode } from "react";
import { useMobile } from "@/lib/mobile-context";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AppHeaderProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function AppHeader({ left, right }: AppHeaderProps) {
  const { isMobile } = useMobile();

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between ${isMobile ? "h-14" : "h-16"}`}>
          <div className="flex items-center gap-2.5 min-w-0">{left}</div>
          <div className="flex items-center gap-0.5 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
            {right}
          </div>
        </div>
      </div>
    </header>
  );
}
