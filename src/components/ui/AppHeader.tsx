"use client";

import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface AppHeaderProps {
  left?: ReactNode;
  right?: ReactNode;
}

export function AppHeader({ left, right }: AppHeaderProps) {
  return (
    <header className="bg-surface/80 backdrop-blur-lg border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5 min-w-0">{left}</div>
          <div className="flex items-center gap-1 shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
            {right}
          </div>
        </div>
      </div>
    </header>
  );
}
