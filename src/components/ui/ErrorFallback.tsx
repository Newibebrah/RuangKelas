"use client";

import { motion } from "framer-motion";
import { HiExclamationCircle } from "react-icons/hi";
import { useLocale } from "@/lib/locale-context";
import { Button } from "./Button";

interface ErrorFallbackProps {
  error?: Error | null;
  reset?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  reset,
  title,
  message,
}: ErrorFallbackProps) {
  const { t } = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6"
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/30 p-8 max-w-md w-full flex flex-col items-center">
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm flex items-center justify-center mb-5 ring-1 ring-red-200/50 dark:ring-red-700/30"
        >
          <HiExclamationCircle className="h-8 w-8 text-red-500" />
        </motion.div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{title || t('common.error')}</h2>
        <p className="text-sm text-text-secondary text-center max-w-md mb-6">
          {message || error?.message || t('common.error') + "."}
        </p>
        {reset && (
          <Button onClick={reset}>{t('common.retry')}</Button>
        )}
      </div>
    </motion.div>
  );
}
