"use client";
import { Link } from "@/i18n/navigation";
import { useLocale } from "@/lib/locale-context";
import { motion } from "framer-motion";

function LostSvg() {
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 sm:w-48 sm:h-48 mx-auto" fill="none">
      {/* Question mark body */}
      <motion.path
        d="M100 30c-19.33 0-35 15.67-35 35h14c0-11.6 9.4-21 21-21s21 9.4 21 21c0 7-3.5 13.33-8.75 17.5C106.25 86.67 100 94 100 105v5h14v-5c0-8 4.5-14.5 10.5-19.25C130.5 79 138 70 138 65c0-19.33-15.67-35-35-35zM97 130v14h6v-14z"
        fill="url(#gradient)"
        className="opacity-80"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      {/* Floating dots */}
      <motion.circle
        cx="50" cy="45" r="4"
        fill="var(--color-text-muted)"
        className="opacity-30"
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="155" cy="50" r="3"
        fill="var(--color-text-muted)"
        className="opacity-20"
        animate={{ y: [5, -5, 5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.circle
        cx="40" cy="140" r="5"
        fill="var(--color-text-muted)"
        className="opacity-25"
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.circle
        cx="160" cy="145" r="3.5"
        fill="var(--color-text-muted)"
        className="opacity-20"
        animate={{ y: [6, -6, 6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-muted px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
          opacity: 0.2,
        }}
      />

      <motion.div
        className="relative z-10 bg-surface/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 sm:p-12 shadow-glass max-w-lg w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-2">
          <LostSvg />
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-7xl sm:text-8xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
        >
          404
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-xl font-semibold text-text-primary mb-2"
        >
          {t('common.pageNotFound')}
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="text-text-secondary text-center max-w-sm mx-auto mb-8 leading-relaxed"
        >
          {t('common.pageNotFoundDesc')}
        </motion.p>

        <motion.div variants={itemVariants}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-medium hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.97] transition-all duration-300"
          >
            {t('action.back')} ke {t('nav.beranda')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
