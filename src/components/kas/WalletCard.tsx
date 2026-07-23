"use client";

import { motion } from "framer-motion";
import { Wallet } from "@/types";
import { formatRupiah } from "@/lib/kas-utils";
import { HiQrcode, HiCreditCard, HiChevronRight } from "react-icons/hi";

interface WalletCardProps {
  wallet: Wallet;
  billAmount: number;
  totalPeriods: number;
  paidCount: number;
  memberProgress: number;
  onClick: () => void;
}

function PaymentMethodIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "qris": return <HiQrcode className={cls} />;
    default: return <HiCreditCard className={cls} />;
  }
}

export function WalletCard({ wallet, billAmount, totalPeriods, paidCount, memberProgress, onClick }: WalletCardProps) {
  const pct = Math.min(memberProgress, 100);
  const strokeDasharray = 2 * Math.PI * 36;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * pct) / 100;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <svg width="88" height="88" className="transform -rotate-90">
            <circle cx="44" cy="44" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-700" />
            <circle cx="44" cy="44" r="36" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
              className="text-indigo-500 dark:text-indigo-400 transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{pct}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{wallet.name}</h3>
            <PaymentMethodIcon type={wallet.paymentMethod.type} />
          </div>
          {wallet.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{wallet.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {formatRupiah(billAmount)} <span className="font-normal text-slate-400">/ {wallet.frequency === "weekly" ? "minggu" : "bulan"}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {paidCount}/{totalPeriods} lunas
            </span>
          </div>
        </div>

        <HiChevronRight className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}
