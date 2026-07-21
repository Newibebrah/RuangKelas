"use client";

import { useMemo } from "react";
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
  const { members } = useRoom();
  const {
    transactions: legacyTx,
    summary: kasSummary,
    loading: kasLoading,
    error: kasError,
  } = useKas(roomId);
  const {
    transactions: newTx,
    loading: txLoading,
    error: txError,
    totalIncome,
    totalExpense,
    balance,
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

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const combinedIncome = totalIncome + legacyTx.filter(t => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0);
  const combinedExpense = totalExpense + legacyTx.filter(t => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0);
  const combinedBalance = balance + kasSummary.saldo;

  const loading = billingLoading || kasLoading || txLoading;
  const errorMessage = billingError || kasError || txError;

  const memberRows = useMemo(
    () => members.map((m) => ({ userId: m.userId, displayName: m.displayName })),
    [members]
  );

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
          totalPaid: paidCount * (bill?.amount || 0),
          totalArrearsAmount: (totalPeriods - paidCount) * (bill?.amount || 0),
        };
      })
      .sort((a, b) => b.paidCount - a.paidCount);
  }, [memberRows, payments, periods, bill?.amount]);

  const allTransactions = useMemo(() => {
    const normalized: {
      id: string;
      type: "income" | "expense";
      amount: number;
      description: string;
      category?: string;
      date: Date;
      source: "lama" | "baru";
      displayName?: string;
    }[] = [];
    legacyTx.forEach((t) => {
      normalized.push({
        id: t.id,
        type: t.type === "pemasukan" ? "income" : "expense",
        amount: t.amount,
        description: t.description,
        category: t.category,
        date: t.date?.toDate?.() || t.createdAt?.toDate?.() || new Date(),
        source: "lama",
        displayName: t.displayName,
      });
    });
    newTx.forEach((t) => {
      normalized.push({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        date: t.createdAt?.toDate?.() || new Date(),
        source: "baru",
      });
    });
    return normalized.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [legacyTx, newTx]);

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

      {/* Ringkasan Keuangan Utama */}
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
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-50">
                <HiCash className={`h-6 w-6 ${combinedBalance >= 0 ? "text-primary-600" : "text-danger"}`} />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Saldo Kas</p>
                <p className={`text-2xl font-bold ${combinedBalance >= 0 ? "text-primary-600" : "text-danger"}`}>
                  {formatRupiah(combinedBalance)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Billing Section */}
      {bill && (
        <>
          {/* Ringkasan Tagihan */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-light">
                    <HiCheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Terkumpul dari Tagihan</p>
                    <p className="text-2xl font-bold text-success">{formatRupiah(billingSummary.totalCollected)}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {billingSummary.paidCount}/{billingSummary.totalPossible} pembayaran lunas
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-light">
                    <HiClock className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Tunggakan</p>
                    <p className="text-2xl font-bold text-warning">{formatRupiah(billingSummary.totalArrears)}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {billingSummary.totalPossible - billingSummary.paidCount} pembayaran belum lunas
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Tabel Pembayaran */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text-primary">Status Pembayaran Anggota</h3>
                <span className="text-xs text-text-muted">
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

          {/* Ranking Pembayaran Anggota */}
          <Card>
            <CardBody>
              <h3 className="text-base font-semibold text-text-primary mb-4">Progres Pembayaran Anggota</h3>
              {memberPaymentStats.length === 0 ? (
                <EmptyState
                  icon={<HiUserGroup className="h-8 w-8" />}
                  title="Belum ada anggota"
                  description="Tambahkan anggota kelas untuk memantau pembayaran"
                />
              ) : (
                <div className="space-y-3">
                  {memberPaymentStats.map((m, idx) => (
                    <div key={m.userId} className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-medium text-text-muted shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary truncate">
                            {m.displayName}
                          </span>
                          <span className={`text-xs font-semibold shrink-0 ml-2 ${
                            m.arrears === 0
                              ? "text-success"
                              : m.arrears <= Math.floor(m.totalPeriods / 2)
                                ? "text-warning"
                                : "text-danger"
                          }`}>
                            {m.paidCount}/{m.totalPeriods}
                          </span>
                        </div>
                        <div className="w-full bg-surface-hover rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              m.arrears === 0
                                ? "bg-success"
                                : m.arrears <= Math.floor(m.totalPeriods / 2)
                                  ? "bg-warning"
                                  : "bg-danger"
                            }`}
                            style={{ width: `${m.progress}%` }}
                          />
                        </div>
                        {m.arrears > 0 && (
                          <p className="text-xs text-text-muted mt-0.5">
                            Tertunggak {formatRupiah(m.totalArrearsAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* No Bill State */}
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

      {/* Riwayat Transaksi */}
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
              {allTransactions.map((trx) => (
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
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
