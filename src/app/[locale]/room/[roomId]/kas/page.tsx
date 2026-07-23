"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { useWallets } from "@/hooks/useWallets";
import { useBatchPayment } from "@/hooks/useBatchPayment";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLocale } from "@/lib/locale-context";
import { WalletCard } from "@/components/kas/WalletCard";
import { PeriodCard } from "@/components/kas/PeriodCard";
import { PaymentModal } from "@/components/kas/PaymentModal";
import { BatchPaymentBar } from "@/components/kas/BatchPaymentBar";
import { ReceiptModal } from "@/components/kas/ReceiptModal";
import { HiCog, HiArrowLeft, HiCreditCard } from "react-icons/hi";

export default function KasPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { wallets, walletsWithData, payments, loading, error } = useWallets(roomId);
  const { canViewKasManagement } = useRoleAccess(roomId);
  const { submitBatch } = useBatchPayment(roomId);

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<{ paymentId: string; periodId?: string; walletId: string } | null>(null);

  const walletData = selectedWalletId ? walletsWithData.find((w) => w.wallet.id === selectedWalletId) : undefined;
  const wallet = walletData?.wallet;
  const walletBill = walletData?.bill;
  const walletPeriods = walletData?.periods || [];
  const walletPayments = walletData?.payments || [];
  const walletBillAmount = walletBill?.amount || 0;

  const myPayments = useMemo(
    () => walletPayments.filter((p) => p.userId === user?.id),
    [walletPayments, user?.id]
  );

  const myProgress = useMemo(() => {
    if (!walletPeriods.length || !user) return 0;
    const paid = myPayments.filter((p) => p.status === "paid").length;
    return Math.round((paid / walletPeriods.length) * 100);
  }, [walletPeriods, myPayments, user]);

  const allPaidAnyWallet = walletsWithData.map((wd) => {
    const myP = wd.payments.filter((p) => p.userId === user?.id);
    const paid = myP.filter((p) => p.status === "paid").length;
    return { wallet: wd.wallet, paid, total: wd.periods.length, progress: wd.periods.length > 0 ? Math.round((paid / wd.periods.length) * 100) : 0 };
  });

  const totalSelected = selectedPeriods.size * walletBillAmount;

  const togglePeriod = (periodId: string) => {
    setSelectedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(periodId)) next.delete(periodId);
      else next.add(periodId);
      return next;
    });
  };

  const handleBatchSubmit = async (proofUrl: string) => {
    const periodIds = Array.from(selectedPeriods);
    await submitBatch(periodIds, proofUrl);
    setSelectedPeriods(new Set());
  };

  if (loading) return <LoadingSpinner size="lg" message={t('common.loadingKas')} />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-4"><HiCreditCard className="h-8 w-8 text-danger" /></div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">{t('common.failedLoad')}</h3>
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {selectedWalletId && (
            <button onClick={() => { setSelectedWalletId(null); setSelectedPeriods(new Set()); }} className="p-1.5 rounded-xl hover:bg-surface-hover transition-colors">
              <HiArrowLeft className="h-5 w-5 text-text-secondary" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-text-primary font-heading">{selectedWalletId ? wallet?.name : t('kas.title')}</h2>
            <p className="text-sm text-text-secondary mt-1">{selectedWalletId ? `Tagihan ${wallet?.frequency === "weekly" ? "per minggu" : "per bulan"}` : t('kas.manageDesc')}</p>
          </div>
        </div>
        {canViewKasManagement && !selectedWalletId && (
          <Button onClick={() => router.push(`/room/${roomId}/kelola-kas`)}><HiCog className="h-4 w-4" />{t('kas.manage')}</Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedWalletId ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {wallets.length === 0 ? (
              <Card><CardBody>
                <EmptyState icon={<HiCreditCard className="h-12 w-12" />} title="Belum ada dompet kas"
                  description={canViewKasManagement ? "Buat dompet kas di Kelola Kas" : "Bendahara belum membuat dompet kas"} />
              </CardBody></Card>
            ) : (
              wallets.map((w, i) => {
                const stat = allPaidAnyWallet.find((s) => s.wallet.id === w.id);
                return (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <WalletCard wallet={w} billAmount={walletBillAmount || 0} totalPeriods={stat?.total || 0} paidCount={stat?.paid || 0} memberProgress={stat?.progress || 0} onClick={() => setSelectedWalletId(w.id)} />
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {wallet && wallet.paymentMethod.type !== "manual" && (
              <Card glass><CardBody>
                <p className="text-xs font-semibold text-text-secondary mb-1">Metode Pembayaran</p>
                <p className="text-sm text-text-primary">{wallet.paymentMethod.type === "qris" ? "QRIS" : wallet.paymentMethod.type === "bank" ? `Transfer ${wallet.paymentMethod.accountName} — ${wallet.paymentMethod.accountNumber}` : "Manual"}</p>
              </CardBody></Card>
            )}
            {walletPeriods.length === 0 ? (
              <Card><CardBody><EmptyState icon={<HiCreditCard className="h-8 w-8" />} title="Belum ada periode" description="Wallet ini belum memiliki periode tagihan" /></CardBody></Card>
            ) : (
              walletPeriods.map((period) => {
                const payment = myPayments.find((p) => p.periodId === period.id);
                return (
                  <PeriodCard key={period.id}
                    period={period} payment={payment} amount={walletBillAmount}
                    selected={selectedPeriods.has(period.id)}
                    onToggle={() => togglePeriod(period.id)}
                    onShowReceipt={payment && (payment.status === "paid" || payment.status === "pending")
                      ? () => setReceiptPayment({ paymentId: payment.id, periodId: period.id, walletId: wallet!.id }) : undefined}
                  />
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BatchPaymentBar count={selectedPeriods.size} total={totalSelected} onSubmit={() => setPaymentModalOpen(true)} />

      {wallet && (
        <PaymentModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)}
          wallet={wallet} amount={totalSelected} periodCount={selectedPeriods.size}
          onSubmit={handleBatchSubmit} />
      )}

      {receiptPayment && (() => {
        const p = payments.find((pay) => pay.id === receiptPayment.paymentId);
        const per = receiptPayment.periodId ? walletPeriods.find((pr) => pr.id === receiptPayment.periodId) : undefined;
        if (!p) return null;
        return (
          <ReceiptModal isOpen onClose={() => setReceiptPayment(null)}
            payment={p} period={per} amount={walletBillAmount}
            walletName={wallet?.name || ""} memberName={p.displayName} />
        );
      })()}
    </div>
  );
}
