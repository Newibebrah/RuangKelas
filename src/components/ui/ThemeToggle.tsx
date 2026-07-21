"use client";

import { useTheme } from "@/lib/theme-context";
import { HiSun, HiMoon } from "react-icons/hi";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all"
      aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <div className="relative h-5 w-5">
        <HiSun
          className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${
            theme === "dark" ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <HiMoon
          className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${
            theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>
    </button>
  );
}
