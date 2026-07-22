"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRoom } from "@/lib/room-context";
import { useKas } from "@/hooks/useKas";
import { useBilling } from "@/hooks/useBilling";
import { useTransactions } from "@/hooks/useTransactions";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentTable } from "@/components/kas/PaymentTable";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  HiCash,
  HiPlus,
  HiDocumentText,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiTrash,
  HiDownload,
  HiArrowLeft,
} from "react-icons/hi";
import { Kas } from "@/types";
import { useLocale } from "@/lib/locale-context";
import { FinanceChart } from "@/components/kas/FinanceChart";
import { formatRupiah, combineKas } from "@/lib/kas-utils";

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number({ message: "Jumlah harus angka" }).positive("Jumlah harus lebih dari 0"),
  description: z.string().min(1, "Deskripsi wajib diisi").max(200, "Deskripsi maksimal 200 karakter"),
  category: z.string().max(100).optional().default(""),
});

type TxFormData = z.infer<typeof txSchema>;

const BillSetupModal = dynamic(
  () => import("@/components/kas/BillSetupModal").then((m) => ({ default: m.BillSetupModal })),
  { ssr: false }
);

let xlsxModule: typeof import("xlsx") | null = null;
async function getXlsx() {
  if (!xlsxModule) {
    xlsxModule = await import("xlsx");
  }
  return xlsxModule;
}

export default function KelolaKasPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { members, currentRoom } = useRoom();
  const {
    transactions: legacyTx,
    summary: kasSummary,
    loading: kasLoading,
    error: kasError,
    deleteTransaction: deleteLegacyTx,
  } = useKas(roomId);
  const {
    canViewKasManagement,
    canManageKas,
    canDownloadReport,
  } = useRoleAccess(roomId);

  const memberCount = members.length;
  const {
    bill,
    periods,
    payments,
    loading: billingLoading,
    error: billingError,
    summary: billingSummary,
    createBill,
    togglePayment,
  } = useBilling(roomId, memberCount);

  const {
    transactions: newTx,
    loading: txLoading,
    error: txError,
    addTransaction: addNewTx,
    deleteTransaction: deleteNewTx,
  } = useTransactions(roomId);

  const { combinedIncome, combinedExpense, combinedBalance } = useMemo(
    () => combineKas(legacyTx, newTx),
    [legacyTx, newTx]
  );

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [deleteNewTxTarget, setDeleteNewTxTarget] = useState<string | null>(null);
  const [legacyDeleteTarget, setLegacyDeleteTarget] = useState<Kas | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TxFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(txSchema) as any,
    defaultValues: { type: "income", amount: 0, description: "", category: "" },
  });

  const watchType = watch("type");

  const memberRows = useMemo(
    () => members.map((m) => ({ userId: m.userId, displayName: m.displayName })),
    [members]
  );

  const handleTogglePayment = useCallback(
    async (userId: string, periodId: string, displayName: string) => {
      if (!bill) return;
      const existing = payments.find(
        (p) => p.userId === userId && p.periodId === periodId
      );
      const willBePaid = existing ? existing.status !== "paid" : true;
      try {
        await togglePayment(userId, periodId, displayName);
        await addNewTx({
          type: willBePaid ? "income" : "expense",
          amount: bill.amount,
          description: willBePaid
            ? `Pembayaran tagihan - ${displayName}`
            : `Pembatalan pembayaran - ${displayName}`,
          category: "Tagihan",
        });
        toast.success(willBePaid ? "Pembayaran dicatat" : "Pembayaran dibatalkan");
      } catch {
        toast.error("Gagal memperbarui pembayaran");
      }
    },
    [togglePayment, addNewTx, bill, payments]
  );

  const handleDownloadExcel = async () => {
    const XLSX = await getXlsx();
    const rows: Record<string, unknown>[] = [];

    legacyTx.forEach((t) => {
      rows.push({
        Tanggal: t.date?.toDate ? format(t.date.toDate(), "dd/MM/yyyy", { locale: id }) : "-",
        Tipe: t.type === "pemasukan" ? "Pemasukan" : "Pengeluaran",
        Deskripsi: t.description,
        Kategori: t.category || "-",
        Jumlah: t.amount,
        Dicatat: format(t.createdAt?.toDate?.() || new Date(), "dd/MM/yyyy HH:mm", { locale: id }),
      });
    });

    newTx.forEach((t) => {
      rows.push({
        Tanggal: t.createdAt?.toDate ? format(t.createdAt.toDate(), "dd/MM/yyyy", { locale: id }) : "-",
        Tipe: t.type === "income" ? "Pemasukan" : "Pengeluaran",
        Deskripsi: t.description,
        Kategori: t.category || "-",
        Jumlah: t.amount,
        Dicatat: format(t.createdAt?.toDate?.() || new Date(), "dd/MM/yyyy HH:mm", { locale: id }),
      });
    });

    rows.sort((a, b) => {
      if ((a.Tanggal as string) < (b.Tanggal as string)) return -1;
      if ((a.Tanggal as string) > (b.Tanggal as string)) return 1;
      return 0;
    });

    const totalIncome = combinedIncome;
    const totalExpense = combinedExpense;

    rows.push({} as Record<string, unknown>);
    rows.push({ Tanggal: "RINGKASAN", Tipe: "", Deskripsi: "", Kategori: "", Jumlah: "", Dicatat: "" } as Record<string, unknown>);
    rows.push({ Tanggal: "Total Pemasukan", Tipe: "", Deskripsi: "", Kategori: "", Jumlah: totalIncome, Dicatat: "" } as Record<string, unknown>);
    rows.push({ Tanggal: "Total Pengeluaran", Tipe: "", Deskripsi: "", Kategori: "", Jumlah: totalExpense, Dicatat: "" } as Record<string, unknown>);
    rows.push({ Tanggal: "Saldo", Tipe: "", Deskripsi: "", Kategori: "", Jumlah: totalIncome - totalExpense, Dicatat: "" } as Record<string, unknown>);

    if (bill) {
      rows.push({} as Record<string, unknown>);
      rows.push({ Tanggal: "TAGIHAN KAS", Tipe: "", Deskripsi: "", Kategori: "", Jumlah: "", Dicatat: "" } as Record<string, unknown>);
      rows.push({ Tanggal: `Tagihan per ${bill.frequency === "weekly" ? "minggu" : "bulan"}`, Tipe: "", Deskripsi: "", Kategori: "", Jumlah: bill.amount, Dicatat: "" } as Record<string, unknown>);
      rows.push({ Tanggal: "Total Terkumpul", Tipe: "", Deskripsi: "", Kategori: "", Jumlah: billingSummary.totalCollected, Dicatat: "" } as Record<string, unknown>);
      rows.push({ Tanggal: "Total Tunggakan", Tipe: "", Deskripsi: "", Kategori: "", Jumlah: billingSummary.totalArrears, Dicatat: "" } as Record<string, unknown>);
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
    XLSX.writeFile(wb, `laporan-keuangan-${currentRoom?.code || roomId}.xlsx`);
    toast.success("Laporan berhasil diunduh!");
  };

  if (!canViewKasManagement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center">
          <HiCash className="h-8 w-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">{t('auth.accessDenied')}</h2>
        <p className="text-sm text-text-secondary text-center max-w-sm">
          {t('kas.accessDeniedDesc')}
        </p>
        <Button onClick={() => router.push(`/room/${roomId}/kas`)} variant="outline">
          {t('action.back')} ke {t('nav.kas')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/room/${roomId}/kas`)}
              className="p-1.5 rounded-xl hover:bg-surface-hover transition-colors"
            >
              <HiArrowLeft className="h-5 w-5 text-text-secondary" />
            </button>
            <h2 className="text-xl font-bold text-text-primary">{t('kas.manage')}</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {canManageKas ? t('kas.manageDesc') : t('kas.viewReportDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageKas && (
            <Button onClick={() => setShowAddTx(true)}>
              <HiPlus className="h-4 w-4" />
              {t('kas.addTransaction')}
            </Button>
          )}
          {canDownloadReport && (
            <Button variant="outline" onClick={handleDownloadExcel}>
              <HiDownload className="h-4 w-4" />
              {t('action.download')} Excel
            </Button>
          )}
        </div>
      </div>

      {/* Ringkasan Keuangan */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary">{t('kas.totalIncome')}</p>
            <p className="text-2xl font-bold text-success">
              {formatRupiah(combinedIncome)}
            </p>
          </CardBody>
        </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-text-secondary">{t('kas.totalExpense')}</p>
                <p className="text-2xl font-bold text-danger">
                  {formatRupiah(combinedExpense)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="!bg-primary-600 !rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                    <HiCash className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">{t('kas.balance')}</p>
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

      {/* Billing Section - only if bill exists */}
          {bill && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success-light">
                        <HiCurrencyDollar className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">{t('kas.collected')}</p>
                        <p className="text-2xl font-bold text-success">{formatRupiah(billingSummary.totalCollected)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning-light">
                        <HiExclamationCircle className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">{t('kas.arrears')}</p>
                        <p className="text-2xl font-bold text-warning">{formatRupiah(billingSummary.totalArrears)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-text-primary">{t('kas.paymentTable')}</h3>
                  <span className="text-xs text-text-muted">
                    {billingSummary.paidCount}/{billingSummary.totalPossible} {t('kas.paid')}
                  </span>
                </div>
                <PaymentTable
                  members={memberRows}
                  periods={periods}
                  payments={payments}
                  canManage={canManageKas}
                  onToggle={handleTogglePayment}
                />
              </div>
            </>
          )}

          {!bill && !billingLoading && (
            <div className="mb-6">
              <Card>
                <CardBody>
                  <EmptyState
                    icon={<HiDocumentText className="h-8 w-8" />}
                    title={t('kas.noBill')}
                    description={
                      canManageKas
                        ? t('kas.noBillManageDesc')
                        : t('kas.noBillNotManageDesc')
                    }
                    action={
                      canManageKas ? (
                        <Button onClick={() => setBillModalOpen(true)}>
                          <HiPlus className="h-4 w-4" />
                          {t('action.createBill')}
                        </Button>
                      ) : undefined
                    }
                  />
                </CardBody>
              </Card>
            </div>
          )}

          {/* Ringkasan Kas Lama (legacy) */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card>
              <CardBody>
                <p className="text-sm text-text-secondary">{t('kas.legacyIncome')}</p>
                <p className="text-2xl font-bold text-success">{formatRupiah(kasSummary.totalPemasukan)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-text-secondary">{t('kas.legacyExpense')}</p>
                <p className="text-2xl font-bold text-danger">{formatRupiah(kasSummary.totalPengeluaran)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-text-secondary">{t('kas.legacyBalance')}</p>
                <p className={`text-2xl font-bold ${kasSummary.saldo >= 0 ? "text-primary-600" : "text-danger"}`}>
                  {formatRupiah(kasSummary.saldo)}
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Daftar Transaksi Baru */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-text-primary">{t('kas.newTransactions')}</h3>
              </CardHeader>
              <CardBody>
                {newTx.length === 0 ? (
                  <EmptyState
                    icon={<HiCash className="h-8 w-8" />}
                    title={t('kas.noTransaction')}
                    description={t('kas.noTxManageDesc')}
                  />
                ) : (
                  <div className="space-y-1">
                    {newTx.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-3 px-2 hover:bg-surface-hover rounded-xl transition-colors group">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${tx.type === "income" ? "bg-success" : "bg-danger"}`} />
                            <p className="text-sm font-medium text-text-primary">{tx.description}</p>
                            {tx.category && (
                              <span className="text-xs px-1.5 py-0.5 bg-surface-hover text-text-secondary rounded-lg font-medium">{tx.category}</span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5 ml-4">
                            {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "dd MMM yyyy", { locale: id }) : "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-danger"}`}>
                            {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                          </span>
                          {canManageKas && (
                            <button
                              onClick={() => setDeleteNewTxTarget(tx.id)}
                              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <HiTrash className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Transaksi Lama (legacy) */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-text-primary">{t('kas.history')} (Kas Lama)</h3>
            </CardHeader>
            <CardBody>
              {legacyTx.length === 0 ? (
                <EmptyState
                  icon={<HiCash className="h-8 w-8" />}
                  title={t('kas.noTransaction')}
                  description="Tidak ada transaksi dari sistem kas sebelumnya"
                />
              ) : (
                <div className="space-y-1">
                  {legacyTx.map((trx) => (
                    <div key={trx.id} className="flex items-center justify-between py-3 px-2 hover:bg-surface-hover rounded-xl transition-colors group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${trx.type === "pemasukan" ? "bg-success" : "bg-danger"}`} />
                          <p className="text-sm font-medium text-text-primary">{trx.description}</p>
                          {trx.category && (
                            <span className="text-xs px-1.5 py-0.5 bg-surface-hover text-text-secondary rounded-lg font-medium">{trx.category}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 ml-4">
                          <p className="text-xs text-text-muted">{trx.displayName}</p>
                          <span className="text-xs text-border">&middot;</span>
                          <p className="text-xs text-text-muted">
                            {format(
                              trx.date && typeof (trx.date as { toDate?: () => Date }).toDate === "function"
                                ? (trx.date as { toDate: () => Date }).toDate()
                                : new Date(),
                              "dd MMM yyyy", { locale: id }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-semibold ${trx.type === "pemasukan" ? "text-success" : "text-danger"}`}>
                          {trx.type === "pemasukan" ? "+" : "-"}{formatRupiah(trx.amount)}
                        </span>
                        {canManageKas && (
                          <button
                            onClick={() => setLegacyDeleteTarget(trx)}
                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <HiTrash className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

      {/* Modal: Setup Tagihan */}
      <BillSetupModal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        onSubmit={async (data) => {
          await createBill(data);
          toast.success("Tagihan berhasil dibuat!");
        }}
      />

      {/* Modal: Tambah Transaksi Baru */}
      <Modal isOpen={showAddTx} onClose={() => setShowAddTx(false)} title={t('kas.addTransactionNew')}>
        <form onSubmit={handleSubmit(async (data) => {
          try {
            await addNewTx(data as TxFormData);
            toast.success("Transaksi berhasil ditambahkan");
            reset({ type: "income", amount: 0, description: "", category: "" });
            setShowAddTx(false);
          } catch {
            toast.error("Gagal menambahkan transaksi");
          }
        })} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t('kas.type')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue("type", "income")}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  watchType === "income"
                    ? "bg-success-light text-success ring-2 ring-success"
                    : "bg-surface text-text-secondary hover:bg-surface-hover border border-border"
                }`}
              >
                {t('kas.income')}
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "expense")}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  watchType === "expense"
                    ? "bg-danger-light text-danger ring-2 ring-danger"
                    : "bg-surface text-text-secondary hover:bg-surface-hover border border-border"
                }`}
              >
                {t('kas.expense')}
              </button>
            </div>
          </div>
          <input type="hidden" {...register("type")} />
          <Input
            label={t('kas.amount')}
            type="number"
            placeholder="0"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <Input
            label={t('kas.description')}
            placeholder={t('kas.descriptionPlaceholder')}
            error={errors.description?.message}
            {...register("description")}
          />
          <Input
            label={t('kas.category')}
            placeholder={t('kas.categoryPlaceholder')}
            error={errors.category?.message}
            {...register("category")}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAddTx(false)}>{t('action.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>{t('action.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Hapus Transaksi Baru */}
      <Modal
        isOpen={!!deleteNewTxTarget}
        onClose={() => setDeleteNewTxTarget(null)}
        title={t('action.delete') + " " + t('kas.title')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{t('common.confirmDelete')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteNewTxTarget(null)}>{t('action.cancel')}</Button>
            <Button variant="danger" onClick={async () => {
              if (deleteNewTxTarget) {
                await deleteNewTx(deleteNewTxTarget);
                toast.success("Transaksi berhasil dihapus");
                setDeleteNewTxTarget(null);
              }
            }}>{t('action.delete')}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Hapus Legacy Transaksi */}
      <Modal
        isOpen={!!legacyDeleteTarget}
        onClose={() => setLegacyDeleteTarget(null)}
        title={t('action.delete') + " " + t('kas.title') + " (Lama)"}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{t('common.confirmDelete')} <strong>{legacyDeleteTarget?.description}</strong>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setLegacyDeleteTarget(null)}>{t('action.cancel')}</Button>
            <Button variant="danger" onClick={async () => {
              if (legacyDeleteTarget) {
                await deleteLegacyTx(legacyDeleteTarget.id);
                toast.success("Transaksi berhasil dihapus");
                setLegacyDeleteTarget(null);
              }
            }}>{t('action.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}