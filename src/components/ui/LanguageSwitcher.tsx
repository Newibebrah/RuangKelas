"use client";

import { useLocale } from "@/lib/locale-context";
import { HiGlobe } from "react-icons/hi";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "id" ? "en" : "id")}
      className="flex items-center gap-1.5 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all text-sm font-medium"
      aria-label={`Switch to ${locale === "id" ? "English" : "Indonesia"}`}
    >
      <HiGlobe className="h-5 w-5" />
      <span className="uppercase font-semibold">{locale}</span>
    </button>
  );
}
