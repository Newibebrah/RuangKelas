"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/locale-context";
import { HiGlobe } from "react-icons/hi";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={() => setLocale(locale === "id" ? "en" : "id")}
      className="flex items-center gap-1.5 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all text-sm font-medium"
      aria-label={`Switch to ${locale === "id" ? "English" : "Indonesia"}`}
    >
      <HiGlobe className="h-5 w-5" />
      <motion.span
        key={locale}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="uppercase font-bold text-xs tracking-wider"
      >
        {locale}
      </motion.span>
    </motion.button>
  );
}
