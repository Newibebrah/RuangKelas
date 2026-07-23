"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useBilling } from "@/hooks/useBilling";
import { useWallets } from "@/hooks/useWallets";
import { useRoom } from "@/lib/room-context";
import { motion } from "framer-motion";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLocale } from "@/lib/locale-context";
import { Payment } from "@/types";
import { formatRupiah } from "@/lib/kas-utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ReceiptModal } from "@/components/kas/ReceiptModal";
import {
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiDocumentText,
  HiCash,
  HiExclamationCircle,
} from "react-icons/hi";

export default function RiwayatPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();
  const { wallets } = useWallets(roomId);
  const { bill, periods, payments, loading, error: bError } = useBilling(roomId, members.length);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  const myPayments = useMemo(() => {
    if (!user) return [];
    return payments
      .filter((p) => p.userId === user.id)
      .sort((a, b) => {
        const aTime = a.paidAt?.toMillis() || 0;
        const bTime = b.paidAt?.toMillis() || 0;
        return bTime - aTime;
      });
  }, [payments, user]);

  const getWalletName = (walletId?: string) => {
    if (!walletId) return "-";
    return wallets.find((w) => w.id === walletId)?.name || "Wallet tidak ditemukan";
  };

  const getPeriodNum = (periodId: string) => {
    return periods.find((p) => p.id === periodId)?.periodNumber || "-";
  };

  const getVerifiedByName = (payment: Payment) => {
    if (!payment.verifiedBy) return undefined;
    const m = members.find((mem) => mem.userId === payment.verifiedBy);
    return m?.displayName;
  };

  if (loading) {
    return <LoadingSpinner size="lg" message={t('common.loadingKas')} />;
  }

  if (bError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <HiExclamationCircle className="h-12 w-12 text-danger mb-3" />
        <p className="font-semibold text-text-primary">{t('common.failedLoad')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary font-heading">Riwayat Pembayaran</h2>
        <p className="text-sm text-text-secondary mt-1">Semua pembayaran yang pernah kamu lakukan</p>
      </div>

      {myPayments.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState icon={<HiCash className="h-12 w-12" />} title="Belum ada riwayat pembayaran" description="Pembayaran yang kamu lakukan akan muncul di sini" />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {myPayments.map((payment, idx) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card glass>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${
                      payment.status === "paid"
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                        : payment.status === "pending"
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                      {payment.status === "paid" ? <HiCheckCircle className="h-5 w-5" /> :
                       payment.status === "pending" ? <HiClock className="h-5 w-5" /> :
                       <HiXCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{getWalletName(payment.walletId)}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          payment.status === "paid"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : payment.status === "pending"
                              ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {payment.status === "paid" ? "Lunas" : payment.status === "pending" ? "Verifikasi" : "Belum"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                        <span>Periode {getPeriodNum(payment.periodId)}</span>
                        <span>&middot;</span>
                        <span>{payment.paidAt ? format(payment.paidAt.toDate(), "dd MMM yyyy", { locale: id }) : "-"}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-text-primary">{formatRupiah(bill?.amount || 0)}</p>
                      {(payment.status === "paid" || payment.status === "pending") && (
                        <button
                          onClick={() => setReceiptPayment(payment)}
                          className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                        >
                          <HiDocumentText className="h-3 w-3" />
                          Terima
                        </button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {receiptPayment && (
        <ReceiptModal
          isOpen
          onClose={() => setReceiptPayment(null)}
          payment={receiptPayment}
          period={periods.find((p) => p.id === receiptPayment.periodId)}
          amount={bill?.amount || 0}
          walletName={getWalletName(receiptPayment.walletId)}
          memberName={receiptPayment.displayName}
          verifiedByName={getVerifiedByName(receiptPayment)}
        />
      )}
    </div>
  );
}
