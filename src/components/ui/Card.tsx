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
      whileHover={hover ? { y: -3, scale: 1.005 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`${
        glass
          ? "bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30"
          : "bg-surface shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_-1px_rgba(0,0,0,0.06)] border border-border/60"
      } rounded-2xl transition-all duration-200 ${
        hover
          ? "hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08),0_2px_4px_-2px_rgba(0,0,0,0.06)] cursor-pointer"
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
    <div className={`px-5 py-4 border-b border-border-light ${className}`}>
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
