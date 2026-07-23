"use client";

import { motion } from "framer-motion";
import { HiExclamationCircle } from "react-icons/hi";
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
        className="w-16 h-16 rounded-2xl bg-danger-light/80 dark:bg-danger/10 backdrop-blur-sm flex items-center justify-center mb-5 ring-1 ring-danger/20 dark:ring-danger/30"
      >
        <HiExclamationCircle className="h-8 w-8 text-danger" />
      </motion.div>
      <h3 className="text-lg font-bold text-text-primary mb-1 font-heading">
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
