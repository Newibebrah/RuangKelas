"use client";

import { motion } from "framer-motion";
import { usePathname, Link } from "@/i18n/navigation";
import { useLocale } from "@/lib/locale-context";
import { TabDefinition } from "@/lib/navigation";

interface BottomNavProps {
  roomId: string;
  visibleTabs: TabDefinition[];
}

export function BottomNav({ roomId, visibleTabs }: BottomNavProps) {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-border/50 safe-area-bottom" aria-label="Navigasi bawah">
      <div className="flex items-center justify-around h-16 px-1">
        {visibleTabs.map((tab) => {
          const href = tab.getHref(roomId);
          const isActive = tab.exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={tab.labelKey}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={t('nav.' + tab.labelKey)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="bottomNavPill"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                />
              )}
              <tab.icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-semibold tracking-tight transition-all duration-300 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`}>
                {t('nav.' + tab.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
