"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { HiSun, HiMoon } from "react-icons/hi";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={toggle}
      className="relative p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
      aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {theme === "dark" ? (
          <HiMoon className="h-5 w-5" />
        ) : (
          <HiSun className="h-5 w-5" />
        )}
      </motion.div>
    </motion.button>
  );
}
