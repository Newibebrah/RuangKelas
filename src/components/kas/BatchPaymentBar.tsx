"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatRupiah } from "@/lib/kas-utils";
import { HiShoppingCart } from "react-icons/hi";

interface BatchPaymentBarProps {
  count: number;
  total: number;
  onSubmit: () => void;
}

export function BatchPaymentBar({ count, total, onSubmit }: BatchPaymentBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="sticky bottom-20 md:bottom-4 left-0 right-0 z-30 px-4"
        >
          <div className="max-w-lg mx-auto p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl shadow-indigo-500/30 border border-white/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-white/80">{count} periode dipilih</p>
                <p className="text-lg font-bold text-white">{formatRupiah(total)}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm shadow-lg hover:shadow-xl transition-all"
              >
                <HiShoppingCart className="h-4 w-4" />
                Bayar Sekaligus
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
