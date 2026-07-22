"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

interface MemberProgressCardProps {
  displayName: string;
  paidCount: number;
  totalPeriods: number;
  amount: number;
}

export function MemberProgressCard({
  displayName,
  paidCount,
  totalPeriods,
  amount,
}: MemberProgressCardProps) {
  const progress = totalPeriods > 0 ? Math.round((paidCount / totalPeriods) * 100) : 0;
  const isFull = paidCount === totalPeriods && totalPeriods > 0;
  const initial = displayName.charAt(0).toUpperCase();

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <Card glass className="p-5 flex flex-col items-center text-center">
      <div className="relative w-28 h-28 mb-3">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={isFull ? "var(--color-success)" : "var(--color-warning)"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${isFull ? "text-success" : "text-warning"}`}>
            {progress}%
          </span>
        </div>
      </div>

      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 ${
          isFull
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
            : "bg-gradient-to-br from-amber-400 to-amber-600"
        }`}
      >
        {initial}
      </div>

      <h4 className="text-sm font-semibold text-text-primary truncate max-w-full">
        {displayName}
      </h4>

      <span
        className={`mt-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
          isFull
            ? "bg-success-light text-success"
            : "bg-warning-light text-warning"
        }`}
      >
        {isFull ? "Lunas" : `Belum (${paidCount}/${totalPeriods})`}
      </span>

      <p className="text-xs text-text-muted mt-2">
        Rp {(paidCount * amount).toLocaleString("id-ID")}
      </p>
    </Card>
  );
}
