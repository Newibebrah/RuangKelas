"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/lib/room-context";
import { useKas } from "@/hooks/useKas";
import { useBilling } from "@/hooks/useBilling";
import { useTransactions } from "@/hooks/useTransactions";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentTable } from "@/components/kas/PaymentTable";
import { FinanceChart } from "@/components/kas/FinanceChart";
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
} from "react-icons/hi";

export default function KasPage() {
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
    return <LoadingSpinner size="lg" message="Memuat data kas..." />;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-4">
          <HiExclamationCircle className="h-8 w-8 text-danger" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-1">Gagal Memuat Data</h3>
        <p className="text-sm text-text-secondary">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Kas Kelas</h2>
          <p className="text-sm text-text-secondary mt-1">
            {bill
              ? `Tagihan ${formatRupiah(bill.amount)} / ${bill.frequency === "weekly" ? "minggu" : "bulan"}`
              : "Pantau pemasukan, pengeluaran, dan pembayaran anggota"}
          </p>
        </div>
        {canViewKasManagement && (
          <Button onClick={() => router.push(`/room/${roomId}/kelola-kas`)}>
            <HiCog className="h-4 w-4" />
            Kelola Kas
          </Button>
        )}
      </div>

      {/* Row 1 — Real Cash Flow */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-light">
                <HiCurrencyDollar className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Pemasukan</p>
                <p className="text-2xl font-bold text-success">{formatRupiah(combinedIncome)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-danger-light">
                <HiCash className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-danger">{formatRupiah(combinedExpense)}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="!bg-primary-600 !rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                <HiCash className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80 font-medium">Saldo Kas</p>
                <p className="text-2xl font-bold text-white">
                  {formatRupiah(combinedBalance)}
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
                <h3 className="text-base font-semibold text-text-primary">Status Pembayaran Anggota</h3>
                <span className="text-xs font-medium text-text-muted bg-surface-hover px-2 py-1 rounded-lg">
                  {billingSummary.paidCount}/{billingSummary.totalPossible} lunas
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
                <h3 className="text-base font-semibold text-text-primary">Progres Anggota</h3>
                <span className="text-xs text-text-muted">
                  {memberArrearsCount} anggota tertunda
                </span>
              </div>
              {memberPaymentStats.length === 0 ? (
                <EmptyState
                  icon={<HiUserGroup className="h-8 w-8" />}
                  title="Belum ada anggota"
                  description="Tambahkan anggota kelas untuk memantau pembayaran"
                />
              ) : (
                <div className="space-y-3">
                  {memberPaymentStats.map((m, idx) => {
                    const isFull = m.paidCount === m.totalPeriods;
                    const isPartial = m.paidCount > 0;
                    return (
                      <div key={m.userId} className="flex items-center gap-3">
                        <span className="w-6 text-center text-sm font-medium text-text-muted shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium truncate ${isFull ? "text-text-primary" : ""}`}>
                              {m.displayName}
                            </span>
                            <span
                              className={`text-xs font-semibold shrink-0 ml-2 ${
                                isFull ? "text-success" : isPartial ? "text-warning" : "text-danger"
                              }`}
                            >
                              {m.paidCount}/{m.totalPeriods}
                            </span>
                          </div>
                          <div className="w-full bg-surface-hover rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isFull ? "bg-success" : isPartial ? "bg-warning" : "bg-danger"
                              }`}
                              style={{ width: `${m.progress}%` }}
                            />
                          </div>
                        </div>
                        {isFull ? (
                          <HiCheckCircle className="h-5 w-5 text-success shrink-0" />
                        ) : (
                          <HiClock className={`h-5 w-5 shrink-0 ${isPartial ? "text-warning" : "text-danger"}`} />
                        )}
                      </div>
                    );
                  })}
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
              title="Belum ada tagihan"
              description={canViewKasManagement ? "Buat tagihan di menu Kelola Kas untuk mulai memantau pembayaran anggota" : "Bendahara belum membuat tagihan"}
            />
          </CardBody>
        </Card>
      )}

      {/* Row 3 — Riwayat Transaksi */}
      <Card>
        <CardBody>
          <h3 className="text-base font-semibold text-text-primary mb-1">Riwayat Transaksi</h3>
          {allTransactions.length === 0 ? (
            <EmptyState
              icon={<HiCash className="h-12 w-12" />}
              title="Belum ada transaksi"
              description={canViewKasManagement ? "Catat transaksi di menu Kelola Kas" : "Belum ada transaksi kas"}
            />
          ) : (
            <div className="space-y-1 mt-3">
              {allTransactions.slice(0, displayCount).map((trx) => (
                <div
                  key={trx.id}
                  className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                          trx.type === "income" ? "bg-success" : "bg-danger"
                        }`}
                      />
                      <p className="text-sm font-medium text-text-primary truncate">
                        {trx.description}
                      </p>
                      {trx.category && (
                        <span className="text-xs px-1.5 py-0.5 bg-surface-hover text-text-secondary rounded-lg font-medium shrink-0">
                          {trx.category}
                        </span>
                      )}
                      {trx.source === "lama" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-lg font-medium shrink-0">
                          lama
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 ml-4">
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
                    className={`text-sm font-semibold shrink-0 ml-2 ${
                      trx.type === "income" ? "text-success" : "text-danger"
                    }`}
                  >
                    {trx.type === "income" ? "+" : "-"}
                    {formatRupiah(trx.amount)}
                  </span>
                </div>
              ))}
              {displayCount < allTransactions.length && (
                <div className="pt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDisplayCount((prev) => prev + 30)}
                  >
                    Tampilkan lebih banyak ({allTransactions.length - displayCount} tersisa)
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
