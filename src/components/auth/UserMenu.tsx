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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-2xl hover:bg-surface-hover transition-colors ring-1 ring-border/50 hover:ring-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-surface">
            <HiUser className="h-4 w-4 text-white" />
          </div>
        )}
        <span className="text-sm font-medium text-text-primary hidden sm:block">
          {user.displayName}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-20 glass shadow-glass border border-border/50"
              role="menu"
              aria-label="Menu pengguna"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="px-4 py-3 border-b border-border/50">
                <p className="text-sm font-semibold text-text-primary">
                  {user.displayName}
                </p>
                {user.username && (
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">@{user.username}</p>
                )}
                <p className="text-xs text-text-muted">{user.email}</p>
                {user.bio && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{user.bio}</p>
                )}
                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg capitalize">
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => {
                  router.push("/profile");
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
