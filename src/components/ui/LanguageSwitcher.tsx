"use client";

import { useLocale } from "@/lib/locale-context";
import { HiGlobe } from "react-icons/hi";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === "id" ? "en" : "id")}
      className="flex items-center gap-1.5 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-all text-sm font-medium"
      title={t("lang.id")}
    >
      <HiGlobe className="h-4 w-4" />
      <span className="hidden sm:inline uppercase">{locale}</span>
    </button>
  );
}
