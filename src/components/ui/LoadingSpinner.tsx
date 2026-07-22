"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function LoadingSpinner({
  size = "md",
  message,
}: LoadingSpinnerProps) {
  const sizes: Record<string, string> = {
    sm: "h-5 w-5",
    md: "h-9 w-9",
    lg: "h-14 w-14",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[3px]`}
      >
        <div className="w-full h-full rounded-full bg-surface" />
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="text-sm font-medium text-text-muted"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
