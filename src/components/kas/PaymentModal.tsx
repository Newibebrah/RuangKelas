"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet } from "@/types";
import { formatRupiah } from "@/lib/kas-utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { HiQrcode, HiCreditCard, HiUpload, HiCheckCircle } from "react-icons/hi";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  amount: number;
  periodCount: number;
  onSubmit: (proofUrl: string) => Promise<void>;
}

export function PaymentModal({ isOpen, onClose, wallet, amount, periodCount, onSubmit }: PaymentModalProps) {
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!proofUrl) {
      toast.error("Harap upload bukti pembayaran");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(proofUrl);
      setDone(true);
      toast.success("Pembayaran berhasil dikirim!");
      setTimeout(() => { onClose(); setDone(false); setProofUrl(""); }, 1500);
    } catch {
      toast.error("Gagal mengirim pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi Pembayaran">
      <div className="space-y-5">
        {done ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center py-8">
            <HiCheckCircle className="h-16 w-16 text-emerald-500 mb-3" />
            <p className="text-lg font-bold text-slate-900 dark:text-white">Pembayaran Terkirim!</p>
            <p className="text-sm text-slate-500">Menunggu verifikasi bendahara</p>
          </motion.div>
        ) : (
          <>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Wallet</span>
                <span className="font-semibold text-slate-900 dark:text-white">{wallet.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Periode</span>
                <span className="font-semibold text-slate-900 dark:text-white">{periodCount} periode</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{formatRupiah(amount)}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/40">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">Metode Pembayaran</p>
              {wallet.paymentMethod.type === "qris" && (
                <div className="flex items-center gap-3">
                  <HiQrcode className="h-6 w-6 text-indigo-600" />
                  <div>
                    {wallet.paymentMethod.qrisImageUrl ? (
                      <img src={wallet.paymentMethod.qrisImageUrl} alt="QRIS" className="w-32 h-32 object-contain rounded-xl bg-white" />
                    ) : (
                      <p className="text-sm text-indigo-600">Scan QRIS</p>
                    )}
                  </div>
                </div>
              )}
              {wallet.paymentMethod.type === "bank" && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <HiCreditCard className="h-5 w-5 text-indigo-600" />
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      {wallet.paymentMethod.accountName}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                    {wallet.paymentMethod.accountNumber}
                  </p>
                </div>
              )}
              {wallet.paymentMethod.type === "manual" && (
                <div className="flex items-center gap-2">
                  <HiCreditCard className="h-5 w-5 text-indigo-600" />
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">Bayar langsung ke bendahara</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Link/URL Bukti Pembayaran
              </label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-1.5">Upload bukti ke Cloudinary/Imgur lalu tempel linknya</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Batal</Button>
              <Button onClick={handleSubmit} disabled={submitting || !proofUrl} isLoading={submitting} className="flex-1">
                <HiUpload className="h-4 w-4" />
                Kirim
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
