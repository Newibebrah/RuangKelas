"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-8"
    >
      <motion.div
        animate={{ x: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm flex items-center justify-center mb-5 ring-1 ring-red-200/50 dark:ring-red-700/30"
      >
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </motion.div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        Terjadi Kesalahan
      </h3>
      <p className="text-sm text-text-secondary text-center max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Coba Lagi
        </Button>
      )}
    </motion.div>
  );
}
