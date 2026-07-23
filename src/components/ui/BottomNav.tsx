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

  const getActiveIndex = () => {
    return visibleTabs.findIndex((tab) => {
      const href = tab.getHref(roomId);
      return tab.exact ? pathname === href : pathname.startsWith(href);
    });
  };

  const activeIndex = getActiveIndex();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-border/40 safe-area-bottom"
      aria-label="Navigasi bawah"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {visibleTabs.map((tab, idx) => {
          const href = tab.getHref(roomId);
          const isActive = activeIndex === idx;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.labelKey}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={t('nav.' + tab.labelKey)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <div className="relative">
                {isActive && (
                  <motion.span
                    layoutId="bottomNavPill"
                    transition={{ type: "spring" as const, stiffness: 500, damping: 35 }}
                    className="absolute -inset-2 rounded-xl bg-primary-50 dark:bg-primary-900/30"
                  />
                )}
                <Icon className={`relative h-5 w-5 transition-all duration-300 ${isActive ? "scale-110" : ""}`} />
              </div>
              <span className={`relative text-[10px] font-semibold tracking-tight transition-all duration-300 ${isActive ? "text-primary-600 dark:text-primary-400" : ""}`}>
                {t('nav.' + tab.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
