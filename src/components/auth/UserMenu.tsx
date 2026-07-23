"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale-context";
import { motion, AnimatePresence } from "framer-motion";
import { HiLogout, HiUser, HiPencil } from "react-icons/hi";

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -8, transformOrigin: "top right" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.15, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -4,
    transition: { duration: 0.1, ease: "easeIn" as const },
  },
};

export function UserMenu() {
  const { t } = useLocale();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-2xl hover:bg-surface-hover transition-colors ring-1 ring-border/40 hover:ring-primary-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Menu pengguna — ${user.displayName}`}
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName}
            width={32}
            height={32}
            className="rounded-full object-cover ring-2 ring-surface"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center ring-2 ring-surface shadow-sm">
            <HiUser className="h-4 w-4 text-white" />
          </div>
        )}
        <span className="text-sm font-semibold text-text-primary hidden sm:block">
          {user.displayName}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20 dark:border-slate-700/30"
              role="menu"
              aria-label="Menu pengguna"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-sm font-bold text-text-primary">{user.displayName}</p>
                {user.username && (
                  <p className="text-xs text-primary-500 dark:text-primary-400 font-medium">@{user.username}</p>
                )}
                <p className="text-xs text-text-muted">{user.email}</p>
                {user.bio && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{user.bio}</p>
                )}
                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-lg capitalize ring-1 ring-primary-200/50 dark:ring-primary-700/30">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  router.push("/profile");
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                role="menuitem"
              >
                <HiPencil className="h-4 w-4" />
                {t('auth.editProfile')}
              </button>
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-danger-light/50 dark:hover:bg-danger/10 hover:text-danger transition-colors"
                role="menuitem"
              >
                <HiLogout className="h-4 w-4" />
                {t('auth.logout')}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
