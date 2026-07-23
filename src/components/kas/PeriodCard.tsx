"use client";

import { motion } from "framer-motion";
import { PaymentPeriod, Payment } from "@/types";
import { formatRupiah } from "@/lib/kas-utils";
import { HiCheckCircle, HiClock, HiXCircle, HiDocumentText } from "react-icons/hi";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PeriodCardProps {
  period: PaymentPeriod;
  payment?: Payment;
  amount: number;
  selected: boolean;
  onToggle: () => void;
  onShowReceipt?: () => void;
}

export function PeriodCard({ period, payment, amount, selected, onToggle, onShowReceipt }: PeriodCardProps) {
  const status = payment?.status || "unpaid";

  return (
    <motion.div
      layout
      className={`relative p-4 rounded-2xl border transition-all duration-300 ${
        status === "paid"
          ? "bg-emerald-50/60 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-700/40"
          : status === "pending"
            ? "bg-amber-50/60 dark:bg-amber-900/15 border-amber-200 dark:border-amber-700/40"
            : selected
              ? "bg-indigo-50/60 dark:bg-indigo-900/15 border-indigo-300 dark:border-indigo-600/50 ring-2 ring-indigo-400/30"
              : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/40 hover:border-slate-300 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-3">
        {status === "unpaid" && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onToggle}
            className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              selected
                ? "bg-indigo-500 border-indigo-500"
                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400"
            }`}
          >
            {selected && <HiCheckCircle className="h-4 w-4 text-white" />}
          </motion.button>
        )}

        {status === "paid" && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center">
            <HiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}

        {status === "pending" && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
            <HiClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Periode {period.periodNumber}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {format(period.dueDate.toDate(), "dd MMM yyyy", { locale: id })}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{formatRupiah(amount)}</p>
          {status === "paid" && payment?.paidAt && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              {format(payment.paidAt.toDate(), "dd MMM", { locale: id })}
            </p>
          )}
          {status === "pending" && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Verifikasi</p>
          )}
        </div>

        {(status === "paid" || status === "pending") && onShowReceipt && (
          <button onClick={onShowReceipt} className="shrink-0 p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            <HiDocumentText className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
