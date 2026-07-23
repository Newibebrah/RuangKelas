"use client";

import { useState } from "react";
import { Payment, PaymentPeriod } from "@/types";
import { formatRupiah } from "@/lib/kas-utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { HiCheckCircle, HiXCircle, HiExternalLink } from "react-icons/hi";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  period?: PaymentPeriod;
  amount: number;
  walletName: string;
  onVerify: (paymentIds: string[], action: "approve" | "reject") => Promise<void>;
}

export function VerificationModal({ isOpen, onClose, payment, period, amount, walletName, onVerify }: VerificationModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    setVerifying(true);
    try {
      await onVerify([payment.id], action);
      setDone(true);
      setTimeout(onClose, 1000);
    } catch {
      setVerifying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verifikasi Pembayaran">
      <div className="space-y-5">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Anggota</span>
            <span className="font-semibold text-slate-900 dark:text-white">{payment.displayName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Wallet</span>
            <span className="font-semibold text-slate-900 dark:text-white">{walletName}</span>
          </div>
          {period && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Periode</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Periode {period.periodNumber} — {format(period.dueDate.toDate(), "dd MMM yyyy", { locale: id })}
              </span>
            </div>
          )}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
            <span className="font-semibold text-slate-900 dark:text-white">Nominal</span>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{formatRupiah(amount)}</span>
          </div>
        </div>

        {payment.proofUrl && (
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bukti Pembayaran</p>
            <a
              href={payment.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <HiExternalLink className="h-4 w-4" />
              Lihat bukti
            </a>
          </div>
        )}

        {payment.batchId && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Batch ID: <span className="font-mono">{payment.batchId.slice(0, 8)}...</span>
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleAction("reject")}
            disabled={verifying || done}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          >
            <HiXCircle className="h-4 w-4" />
            Tolak
          </Button>
          <Button
            onClick={() => handleAction("approve")}
            disabled={verifying || done}
            isLoading={verifying}
            className="flex-1"
          >
            <HiCheckCircle className="h-4 w-4" />
            Setujui
          </Button>
        </div>
        {done && (
          <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Berhasil diverifikasi!
          </p>
        )}
      </div>
    </Modal>
  );
}
