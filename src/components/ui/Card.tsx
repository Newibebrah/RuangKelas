"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glass?: boolean;
}

export function Card({
  children,
  className = "",
  onClick,
  hover = false,
  glass = false,
}: CardProps) {
  const Comp = onClick ? motion.div : motion.div;
  return (
    <Comp
      whileHover={hover ? { y: -6, scale: 1.015 } : undefined}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`${
        glass
          ? "bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-black/20"
          : "bg-white dark:bg-slate-900/80 shadow-lg shadow-black/5 dark:shadow-black/20 border border-slate-200/80 dark:border-slate-700/50"
      } rounded-2xl transition-all duration-200 ${
        hover
          ? "hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-indigo-500/5 cursor-pointer"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
