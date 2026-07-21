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
  return (
    <div
      className={`${
        glass ? "glass" : "bg-surface shadow-card border border-border"
      } rounded-xl transition-all duration-200 ${
        hover
          ? "hover:shadow-card-hover hover:border-primary-200 hover:-translate-y-0.5 cursor-pointer dark:hover:border-primary-700"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
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
    <div className={`px-5 py-4 border-b border-border-light dark:border-slate-700/50 ${className}`}>
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
