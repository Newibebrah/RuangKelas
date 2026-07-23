"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { useWallets } from "@/hooks/useWallets";
import { useBilling } from "@/hooks/useBilling";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useBatchPayment } from "@/hooks/useBatchPayment";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLocale } from "@/lib/locale-context";
import { WalletCard } from "@/components/kas/WalletCard";
import { PeriodCard } from "@/components/kas/PeriodCard";
import { PaymentModal } from "@/components/kas/PaymentModal";
import { BatchPaymentBar } from "@/components/kas/BatchPaymentBar";
import { ReceiptModal } from "@/components/kas/ReceiptModal";
import { HiCog, HiArrowLeft, HiCreditCard, HiExclamationCircle } from "react-icons/hi";

export default function KasPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();
  const { wallets, loading: wLoading, error: wError } = useWallets(roomId);
  const { canViewKasManagement, canManageKas } = useRoleAccess(roomId);
  const { submitBatch } = useBatchPayment(roomId);
  const memberCount = members.length;
  const { bill, periods, payments, loading: bLoading, error: bError } = useBilling(roomId, memberCount);

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<{ payment: string; period?: string } | null>(null);

  const loading = wLoading || bLoading;
  const errorMessage = wError || bError;

  const wallet = wallets.find((w) => w.id === selectedWallet);

  const walletPeriods = useMemo(() => {
    if (!wallet) return [];
    const wBill = bill && bill.walletId === wallet.id ? bill : null;
    if (!wBill) return [];
    return periods.filter((p) => p.walletId === wallet.id).sort((a, b) => a.periodNumber - b.periodNumber);
  }, [wallet, bill, periods]);

  const walletPayments = useMemo(() => {
    if (!wallet) return [];
    return payments.filter((p) => p.walletId === wallet.id);
  }, [wallet, payments]);

  const walletBillAmount = useMemo(() => {
    if (!wallet) return 0;
    const wBill = bill && bill.walletId === wallet.id ? bill : null;
    return wBill?.amount || 0;
  }, [wallet, bill]);

  const walletProgress = useMemo(() => {
    if (!wallet || walletPeriods.length === 0 || !user) return 0;
    const myPayments = walletPayments.filter((p) => p.userId === user.id);
    const paid = myPayments.filter((p) => p.status === "paid").length;
    return Math.round((paid / walletPeriods.length) * 100);
  }, [wallet, walletPeriods, walletPayments, user]);

  const myPaymentsForSelectedWallet = useMemo(() => {
    if (!user) return [];
    return walletPayments.filter((p) => p.userId === user.id);
  }, [walletPayments, user]);

  const totalSelected = useMemo(() => {
    return selectedPeriods.size * walletBillAmount;
  }, [selectedPeriods, walletBillAmount]);

  const togglePeriod = (periodId: string) => {
    setSelectedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId);
      else next.add(periodId);
      return next;
    });
  };

  const handleBatchSubmit = async (proofUrl: string) => {
    if (!selectedWallet) return;
    const periodIds = Array.from(selectedPeriods);
    await submitBatch(periodIds, proofUrl);
    setSelectedPeriods(new Set());
  };

  if (loading) {
    return <LoadingSpinner size="lg" message={t('common.loadingKas')} />;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-4">
          <HiExclamationCircle className="h-8 w-8 text-danger" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">{t('common.failedLoad')}</h3>
        <p className="text-sm text-text-secondary">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {selectedWallet ? (
            <button onClick={() => setSelectedWallet(null)} className="p-1.5 rounded-xl hover:bg-surface-hover transition-colors">
              <HiArrowLeft className="h-5 w-5 text-text-secondary" />
            </button>
          ) : null}
          <div>
            <h2 className="text-xl font-bold text-text-primary font-heading">
              {selectedWallet ? wallet?.name : t('kas.title')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {selectedWallet ? `Tagihan ${wallet?.frequency === "weekly" ? t('kas.frequencyWeekly') : t('kas.frequencyMonthly')}` : t('kas.manageDesc')}
            </p>
          </div>
        </div>
        {canViewKasManagement && !selectedWallet && (
          <Button onClick={() => router.push(`/room/${roomId}/kelola-kas`)}>
            <HiCog className="h-4 w-4" />
            {t('kas.manage')}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedWallet ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {wallets.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="flex flex-col items-center py-8">
                    <HiCreditCard className="h-12 w-12 text-text-muted mb-3" />
                    <p className="font-semibold text-text-primary">Belum ada dompet kas</p>
                    <p className="text-sm text-text-secondary mt-1 text-center max-w-sm">
                      {canManageKas ? "Buat dompet kas di menu Kelola Kas untuk mulai menagih" : "Bendahara belum membuat dompet kas"}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              wallets.map((w, i) => {
                const wPaid = walletPayments.filter((p) => p.walletId === w.id && p.status === "paid").length;
                const wTotal = walletPeriods.length;
                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <WalletCard
                      wallet={w}
                      billAmount={walletBillAmount || 0}
                      totalPeriods={wTotal}
                      paidCount={wPaid}
                      memberProgress={walletProgress}
                      onClick={() => setSelectedWallet(w.id)}
                    />
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Payment method banner */}
            {wallet && wallet.paymentMethod.type !== "manual" && (
              <Card glass>
                <CardBody>
                  <p className="text-xs font-semibold text-text-secondary mb-1">Metode Pembayaran</p>
                  <div className="flex items-center gap-2 text-sm text-text-primary">
                    {wallet.paymentMethod.type === "qris" ? "QRIS" : wallet.paymentMethod.type === "bank" ? `Transfer ${wallet.paymentMethod.accountName} — ${wallet.paymentMethod.accountNumber}` : "Manual"}
                  </div>
                </CardBody>
              </Card>
            )}

            {walletPeriods.map((period) => {
              const payment = myPaymentsForSelectedWallet.find((p) => p.periodId === period.id);
              return (
                <PeriodCard
                  key={period.id}
                  period={period}
                  payment={payment}
                  amount={walletBillAmount}
                  selected={selectedPeriods.has(period.id)}
                  onToggle={() => togglePeriod(period.id)}
                  onShowReceipt={
                    payment && (payment.status === "paid" || payment.status === "pending")
                      ? () => setReceiptPayment({ payment: payment.id, period: period.id })
                      : undefined
                  }
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <BatchPaymentBar
        count={selectedPeriods.size}
        total={totalSelected}
        onSubmit={() => setPaymentModalOpen(true)}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        wallet={wallet!}
        amount={totalSelected}
        periodCount={selectedPeriods.size}
        onSubmit={handleBatchSubmit}
      />

      {receiptPayment && (() => {
        const p = payments.find((pay) => pay.id === receiptPayment.payment);
        const per = receiptPayment.period ? periods.find((pr) => pr.id === receiptPayment.period) : undefined;
        if (!p) return null;
        return (
          <ReceiptModal
            isOpen
            onClose={() => setReceiptPayment(null)}
            payment={p}
            period={per}
            amount={walletBillAmount}
            walletName={wallet?.name || ""}
            memberName={p.displayName}
          />
        );
      })()}
    </div>
  );
}
