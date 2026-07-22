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
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`${
        glass
          ? "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30"
          : "bg-surface shadow-card border border-border"
      } rounded-2xl transition-shadow duration-300 ${
        hover
          ? "hover:shadow-card-hover cursor-pointer"
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
    <div className={`px-6 py-5 border-b border-border-light dark:border-slate-700/50 ${className}`}>
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
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
