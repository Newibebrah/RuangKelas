"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useRoom } from "@/lib/room-context";
import { useKas } from "@/hooks/useKas";
import { useBilling } from "@/hooks/useBilling";
import { useTransactions } from "@/hooks/useTransactions";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { animate, useInView } from "framer-motion";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentTable } from "@/components/kas/PaymentTable";
import { MemberProgressCard } from "@/components/kas/MemberProgressCard";
import { FinanceChart } from "@/components/kas/FinanceChart";
import { useLocale } from "@/lib/locale-context";
import { formatRupiah, combineKas, normalizeTransactions } from "@/lib/kas-utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  HiCash,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiCog,
  HiCheckCircle,
  HiClock,
  HiUserGroup,
  HiDocumentText,
  HiTrendingUp,
  HiTrendingDown,
  HiCreditCard,
} from "react-icons/hi";

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        setDisplayed(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>{displayed.toLocaleString("id-ID")}</span>;
}

export default function KasPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [displayCount, setDisplayCount] = useState(20);
  const { members } = useRoom();
  const {
    transactions: legacyTx,
    loading: kasLoading,
    error: kasError,
  } = useKas(roomId);
  const {
    transactions: newTx,
    loading: txLoading,
    error: txError,
  } = useTransactions(roomId);
  const { canViewKasManagement } = useRoleAccess(roomId);

  const memberCount = members.length;
  const {
    bill,
    periods,
    payments,
    loading: billingLoading,
    summary: billingSummary,
    error: billingError,
  } = useBilling(roomId, memberCount);

  const { combinedIncome, combinedExpense, combinedBalance } = useMemo(
    () => combineKas(legacyTx, newTx),
    [legacyTx, newTx]
  );

  const loading = billingLoading || kasLoading || txLoading;
  const errorMessage = billingError || kasError || txError;

  const memberRows = useMemo(
    () => members.map((m) => ({ userId: m.userId, displayName: m.displayName })),
    [members]
  );

  const memberArrearsCount = useMemo(() => {
    if (!bill || periods.length === 0) return 0;
    return memberRows.filter((m) => {
      const paidCount = payments.filter((p) => p.userId === m.userId && p.status === "paid").length;
      return paidCount < periods.length;
    }).length;
  }, [memberRows, payments, periods, bill]);

  const memberPaymentStats = useMemo(() => {
    return memberRows
      .map((m) => {
        const paidCount = payments.filter((p) => p.userId === m.userId && p.status === "paid").length;
        const totalPeriods = periods.length;
        return {
          ...m,
          paidCount,
          totalPeriods,
          progress: totalPeriods > 0 ? Math.round((paidCount / totalPeriods) * 100) : 0,
          arrears: totalPeriods - paidCount,
        };
      })
      .sort((a, b) => b.paidCount - a.paidCount);
  }, [memberRows, payments, periods]);

  const allTransactions = useMemo(
    () => normalizeTransactions(legacyTx, newTx),
    [legacyTx, newTx]
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{t('kas.title')}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {bill
              ? `Tagihan ${formatRupiah(bill.amount)} / ${bill.frequency === "weekly" ? t('kas.frequencyWeekly') : t('kas.frequencyMonthly')}`
              : t('kas.manageDesc')}
          </p>
        </div>
        {canViewKasManagement && (
          <Button onClick={() => router.push(`/room/${roomId}/kelola-kas`)}>
            <HiCog className="h-4 w-4" />
            {t('kas.manage')}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card glass className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-emerald-600/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
                <HiTrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">{t('kas.totalIncome')}</p>
                <p className="text-xl font-bold text-success">
                  Rp <AnimatedNumber value={combinedIncome} />
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card glass className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-400/10 to-rose-600/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-500/25">
                <HiTrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary">{t('kas.totalExpense')}</p>
                <p className="text-xl font-bold text-danger">
                  Rp <AnimatedNumber value={combinedExpense} />
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card glass className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700 border-primary-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm">
                <HiCreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/80">{t('kas.balance')}</p>
                <p className="text-xl font-bold text-white">
                  Rp <AnimatedNumber value={combinedBalance} />
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Grafik Keuangan */}
      <FinanceChart
        income={combinedIncome}
        expense={combinedExpense}
        balance={combinedBalance}
      />

      {/* Row 2 — Member Payment Tracker */}
      {bill && (
        <>
          <Card>
            <CardBody className="!pb-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text-primary">{t('kas.paymentStatus')}</h3>
                <span className="text-xs font-medium text-text-muted bg-surface-hover px-3 py-1.5 rounded-xl">
                  {billingSummary.paidCount}/{billingSummary.totalPossible} {t('kas.paid')}
                </span>
              </div>
              <PaymentTable
                members={memberRows}
                periods={periods}
                payments={payments}
                canManage={false}
                onToggle={async () => {}}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-primary">{t('kas.memberProgress')}</h3>
                <span className="text-xs text-text-muted bg-surface-hover px-3 py-1.5 rounded-xl">
                  {memberArrearsCount} {t('kas.membersArrears')}
                </span>
              </div>
              {memberPaymentStats.length === 0 ? (
                <EmptyState
                  icon={<HiUserGroup className="h-8 w-8" />}
                  title={t('common.emptyMembers')}
                  description={t('kas.noMemberPaymentDesc')}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {memberPaymentStats.map((m) => (
                    <MemberProgressCard
                      key={m.userId}
                      displayName={m.displayName}
                      paidCount={m.paidCount}
                      totalPeriods={m.totalPeriods}
                      amount={bill?.amount || 0}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {!bill && !billingLoading && (
        <Card>
          <CardBody>
            <EmptyState
              icon={<HiDocumentText className="h-12 w-12" />}
              title={t('kas.noBill')}
              description={canViewKasManagement ? t('kas.noBillManageDesc') : t('kas.noBillNotManageDesc')}
            />
          </CardBody>
        </Card>
      )}

      {/* Transaction History Timeline */}
      <Card>
        <CardBody>
          <h3 className="text-base font-semibold text-text-primary mb-4">{t('kas.history')}</h3>
          {allTransactions.length === 0 ? (
            <EmptyState
              icon={<HiCash className="h-12 w-12" />}
              title={t('kas.noTransaction')}
              description={canViewKasManagement ? t('kas.noTxManageDesc') : t('kas.noTxNotManageDesc')}
            />
          ) : (
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-1">
                {allTransactions.slice(0, displayCount).map((trx, idx) => (
                  <div
                    key={trx.id}
                    className="relative flex items-start gap-4 py-3 px-4 rounded-2xl hover:bg-surface-hover transition-colors group"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`relative z-10 mt-1 w-5 h-5 rounded-full border-2 border-surface shrink-0 flex items-center justify-center ${
                        trx.type === "income"
                          ? "bg-success-light border-success/30"
                          : "bg-danger-light border-danger/30"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          trx.type === "income" ? "bg-success" : "bg-danger"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-primary">
                          {trx.description}
                        </p>
                        {trx.category && (
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                              trx.type === "income"
                                ? "bg-success-light text-success"
                                : "bg-danger-light text-danger"
                            }`}
                          >
                            {trx.category}
                          </span>
                        )}
                        {trx.source === "lama" && (
                          <span className="text-[10px] px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full font-medium">
                            lama
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {trx.displayName && (
                          <>
                            <p className="text-xs text-text-muted">{trx.displayName}</p>
                            <span className="text-xs text-border">&middot;</span>
                          </>
                        )}
                        <p className="text-xs text-text-muted">
                          {format(trx.date, "dd MMM yyyy", { locale: id })}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-sm font-bold shrink-0 ml-2 ${
                        trx.type === "income" ? "text-success" : "text-danger"
                      }`}
                    >
                      {trx.type === "income" ? "+" : "-"}
                      {formatRupiah(trx.amount)}
                    </span>
                  </div>
                ))}
              </div>

              {displayCount < allTransactions.length && (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisplayCount((prev) => prev + 30)}
                  >
                    {t('action.showMore')} ({allTransactions.length - displayCount} {t('action.remaining')})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
