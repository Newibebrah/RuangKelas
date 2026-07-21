"use client";

import { HiSun, HiMoon } from "react-icons/hi";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
    </button>
  );
}
