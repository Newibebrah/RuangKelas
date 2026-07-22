"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence, animate, useInView } from "framer-motion";
import { useRoom } from "@/lib/room-context";
import { useKas } from "@/hooks/useKas";
import { useBilling } from "@/hooks/useBilling";
import { useTransactions } from "@/hooks/useTransactions";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
  HiTrendingUp,
  HiTrendingDown,
  HiCreditCard,
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

type TabKey = "baru" | "riwayat";

export default function KelolaKasPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [activeTab, setActiveTab] = useState<TabKey>("baru");
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
      {/* Header */}
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
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button onClick={() => setShowAddTx(true)}>
                <HiPlus className="h-4 w-4" />
                {t('kas.addTransaction')}
              </Button>
            </motion.div>
          )}
          {canDownloadReport && (
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={handleDownloadExcel}>
                <HiDownload className="h-4 w-4" />
                {t('action.download')} Excel
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
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

      {/* Finance Chart */}
      <FinanceChart
        income={combinedIncome}
        expense={combinedExpense}
        balance={combinedBalance}
      />

      {/* Tabs: Transaksi Baru / Riwayat Transaksi */}
      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-surface-hover rounded-2xl w-fit mb-4">
          <button
            onClick={() => setActiveTab("baru")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "baru"
                ? "bg-white dark:bg-slate-800 text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Transaksi Baru
          </button>
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "riwayat"
                ? "bg-white dark:bg-slate-800 text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Riwayat Transaksi
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "baru" ? (
            <motion.div
              key="baru"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Card glass>
                <CardBody>
                  <h3 className="text-base font-semibold text-text-primary mb-4">
                    Tambah Transaksi Baru
                  </h3>
                  <form
                    onSubmit={handleSubmit(async (data) => {
                      try {
                        await addNewTx(data as TxFormData);
                        toast.success("Transaksi berhasil ditambahkan");
                        reset({ type: "income", amount: 0, description: "", category: "" });
                      } catch {
                        toast.error("Gagal menambahkan transaksi");
                      }
                    })}
                    className="space-y-4"
                  >
                    <div className="flex gap-2 p-1 bg-surface-hover rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setValue("type", "income")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          watchType === "income"
                            ? "bg-white dark:bg-slate-800 text-success shadow-sm shadow-success/10 ring-1 ring-success/20"
                            : "text-text-muted hover:text-text-secondary"
                        }`}
                      >
                        <HiTrendingUp className="h-4 w-4" />
                        {t('kas.income')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("type", "expense")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          watchType === "expense"
                            ? "bg-white dark:bg-slate-800 text-danger shadow-sm shadow-danger/10 ring-1 ring-danger/20"
                            : "text-text-muted hover:text-text-secondary"
                        }`}
                      >
                        <HiTrendingDown className="h-4 w-4" />
                        {t('kas.expense')}
                      </button>
                    </div>
                    <input type="hidden" {...register("type")} />

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted z-10">
                        Rp
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        {...register("amount")}
                        className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200"
                      />
                      {errors.amount?.message && (
                        <p className="text-xs text-danger mt-1 ml-1">{errors.amount.message}</p>
                      )}
                    </div>

                    <select
                      {...register("category")}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 appearance-none"
                    >
                      <option value="">Pilih kategori</option>
                      <option value="Iuran">Iuran</option>
                      <option value="Dana Kelas">Dana Kelas</option>
                      <option value="Peralatan">Peralatan</option>
                      <option value="Kegiatan">Kegiatan</option>
                      <option value="Dekorasi">Dekorasi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>

                    <div className="relative">
                      <textarea
                        placeholder="Deskripsi transaksi"
                        rows={3}
                        {...register("description")}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 resize-none"
                      />
                      {errors.description?.message && (
                        <p className="text-xs text-danger mt-1 ml-1">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <motion.div whileTap={{ scale: 0.95 }}>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          isLoading={isSubmitting}
                          variant="primary"
                        >
                          <HiPlus className="h-4 w-4" />
                          {t('kas.addTransaction')}
                        </Button>
                      </motion.div>
                    </div>
                  </form>
                </CardBody>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="riwayat"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Transaksi Baru */}
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
                      {newTx.map((tx, idx) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.03 }}
                          className="flex items-center justify-between py-3 px-4 hover:bg-surface-hover rounded-2xl transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-xl shrink-0 ${
                                  tx.type === "income"
                                    ? "bg-success-light text-success"
                                    : "bg-danger-light text-danger"
                                }`}
                              >
                                {tx.type === "income"
                                  ? <HiTrendingUp className="h-4 w-4" />
                                  : <HiTrendingDown className="h-4 w-4" />
                                }
                              </span>
                              <p className="text-sm font-medium text-text-primary">{tx.description}</p>
                              {tx.category && (
                                <span
                                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                                    tx.type === "income"
                                      ? "bg-success-light text-success"
                                      : "bg-danger-light text-danger"
                                  }`}
                                >
                                  {tx.category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted mt-0.5 ml-9">
                              {tx.createdAt?.toDate ? format(tx.createdAt.toDate(), "dd MMM yyyy", { locale: id }) : "-"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-sm font-bold ${tx.type === "income" ? "text-success" : "text-danger"}`}>
                              {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                            </span>
                            {canManageKas && (
                              <button
                                onClick={() => setDeleteNewTxTarget(tx.id)}
                                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <HiTrash className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

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
                      {legacyTx.map((trx, idx) => (
                        <motion.div
                          key={trx.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.02 }}
                          className="flex items-center justify-between py-3 px-4 hover:bg-surface-hover rounded-2xl transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-xl shrink-0 ${
                                  trx.type === "pemasukan"
                                    ? "bg-success-light text-success"
                                    : "bg-danger-light text-danger"
                                }`}
                              >
                                {trx.type === "pemasukan"
                                  ? <HiTrendingUp className="h-4 w-4" />
                                  : <HiTrendingDown className="h-4 w-4" />
                                }
                              </span>
                              <p className="text-sm font-medium text-text-primary">{trx.description}</p>
                              {trx.category && (
                                <span
                                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                                    trx.type === "pemasukan"
                                      ? "bg-success-light text-success"
                                      : "bg-danger-light text-danger"
                                  }`}
                                >
                                  {trx.category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 ml-9">
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
                            <span className={`text-sm font-bold ${trx.type === "pemasukan" ? "text-success" : "text-danger"}`}>
                              {trx.type === "pemasukan" ? "+" : "-"}{formatRupiah(trx.amount)}
                            </span>
                            {canManageKas && (
                              <button
                                onClick={() => setLegacyDeleteTarget(trx)}
                                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-light rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <HiTrash className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Billing Section */}
      {bill && (
        <div className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Card glass>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
                    <HiCurrencyDollar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-secondary">{t('kas.collected')}</p>
                    <p className="text-xl font-bold text-success">{formatRupiah(billingSummary.totalCollected)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card glass>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
                    <HiExclamationCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-secondary">{t('kas.arrears')}</p>
                    <p className="text-xl font-bold text-warning">{formatRupiah(billingSummary.totalArrears)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-text-primary">{t('kas.paymentTable')}</h3>
                <span className="text-xs font-medium text-text-muted bg-surface-hover px-3 py-1.5 rounded-xl">
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
            </CardBody>
          </Card>
        </div>
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
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => setBillModalOpen(true)}>
                        <HiPlus className="h-4 w-4" />
                        {t('action.createBill')}
                      </Button>
                    </motion.div>
                  ) : undefined
                }
              />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Legacy Kas Summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-text-secondary">{t('kas.legacyIncome')}</p>
            <p className="text-xl font-bold text-success">{formatRupiah(kasSummary.totalPemasukan)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-text-secondary">{t('kas.legacyExpense')}</p>
            <p className="text-xl font-bold text-danger">{formatRupiah(kasSummary.totalPengeluaran)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-text-secondary">{t('kas.legacyBalance')}</p>
            <p className={`text-xl font-bold ${kasSummary.saldo >= 0 ? "text-primary-600" : "text-danger"}`}>
              {formatRupiah(kasSummary.saldo)}
            </p>
          </CardBody>
        </Card>
      </div>

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
        })} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('kas.type')}</label>
            <div className="flex gap-2 p-1 bg-surface-hover rounded-2xl">
              <button
                type="button"
                onClick={() => setValue("type", "income")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  watchType === "income"
                    ? "bg-white dark:bg-slate-800 text-success shadow-sm shadow-success/10 ring-1 ring-success/20"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <HiTrendingUp className="h-4 w-4" />
                {t('kas.income')}
              </button>
              <button
                type="button"
                onClick={() => setValue("type", "expense")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  watchType === "expense"
                    ? "bg-white dark:bg-slate-800 text-danger shadow-sm shadow-danger/10 ring-1 ring-danger/20"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <HiTrendingDown className="h-4 w-4" />
                {t('kas.expense')}
              </button>
            </div>
          </div>
          <input type="hidden" {...register("type")} />
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted z-10">
              Rp
            </span>
            <input
              type="number"
              placeholder="0"
              {...register("amount")}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200"
            />
            {errors.amount?.message && (
              <p className="text-xs text-danger mt-1 ml-1">{errors.amount.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('kas.category')}</label>
            <select
              {...register("category")}
              className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 appearance-none"
            >
              <option value="">Pilih kategori</option>
              <option value="Iuran">Iuran</option>
              <option value="Dana Kelas">Dana Kelas</option>
              <option value="Peralatan">Peralatan</option>
              <option value="Kegiatan">Kegiatan</option>
              <option value="Dekorasi">Dekorasi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('kas.description')}</label>
            <textarea
              placeholder={t('kas.descriptionPlaceholder')}
              rows={3}
              {...register("description")}
              className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 resize-none"
            />
            {errors.description?.message && (
              <p className="text-xs text-danger mt-1 ml-1">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowAddTx(false)}>{t('action.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting} variant="primary">{t('action.save')}</Button>
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
