"use client";

import { useRef } from "react";
import { Payment, PaymentPeriod } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/kas-utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { HiPrinter } from "react-icons/hi";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  period?: PaymentPeriod;
  amount: number;
  walletName: string;
  memberName: string;
  verifiedByName?: string;
}

export function ReceiptModal({ isOpen, onClose, payment, period, amount, walletName, memberName, verifiedByName }: ReceiptModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tanda Terima Digital">
      <div className="space-y-4">
        <div
          ref={ref}
          className="p-6 rounded-2xl bg-white border border-slate-200 print:border-none print:shadow-none"
        >
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-slate-900">TANDA TERIMA</h3>
            <p className="text-xs text-slate-500">Digital Receipt</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama</span>
              <span className="font-semibold text-slate-900">{memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Wallet</span>
              <span className="font-semibold text-slate-900">{walletName}</span>
            </div>
            {period && (
              <div className="flex justify-between">
                <span className="text-slate-500">Periode</span>
                <span className="font-semibold text-slate-900">Periode {period.periodNumber}</span>
              </div>
            )}
            {period && (
              <div className="flex justify-between">
                <span className="text-slate-500">Jatuh Tempo</span>
                <span className="text-slate-900">{format(period.dueDate.toDate(), "dd MMM yyyy", { locale: id })}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-bold text-slate-900">Jumlah</span>
              <span className="text-xl font-extrabold text-indigo-600">{formatRupiah(amount)}</span>
            </div>
            {payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Bayar</span>
                <span className="text-slate-900">{format(payment.paidAt.toDate(), "dd MMM yyyy HH:mm", { locale: id })}</span>
              </div>
            )}
            {verifiedByName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Diverifikasi oleh</span>
                <span className="font-semibold text-slate-900">{verifiedByName}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-400">Tanda terima ini sah dan diterbitkan secara digital</p>
          </div>
        </div>

        <Button variant="outline" onClick={() => window.print()} className="w-full print:hidden">
          <HiPrinter className="h-4 w-4" />
          Cetak
        </Button>
      </div>
    </Modal>
  );
}
