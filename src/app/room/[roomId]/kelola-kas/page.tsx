"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
import { FinanceChart } from "@/components/kas/FinanceChart";

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
    totalIncome: newTotalIncome,
    totalExpense: newTotalExpense,
    balance: newBalance,
  } = useTransactions(roomId);

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [txForm, setTxForm] = useState({ type: "income" as "income" | "expense", amount: 0, description: "", category: "" });
  const [deleteNewTxTarget, setDeleteNewTxTarget] = useState<string | null>(null);
  const [legacyDeleteTarget, setLegacyDeleteTarget] = useState<Kas | null>(null);

  const memberRows = useMemo(
    () => members.map((m) => ({ userId: m.userId, displayName: m.displayName })),
    [members]
  );

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const handleAddTx = async () => {
    if (!txForm.amount || !txForm.description) {
      toast.error("Lengkapi semua field");
      return;
    }
    try {
      await addNewTx(txForm);
      toast.success("Transaksi berhasil ditambahkan");
      setTxForm({ type: "income", amount: 0, description: "", category: "" });
      setShowAddTx(false);
    } catch {
      toast.error("Gagal menambahkan transaksi");
    }
  };

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

    const totalIncome = legacyTx.filter(t => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0) + newTotalIncome;
    const totalExpense = legacyTx.filter(t => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0) + newTotalExpense;

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
        <h2 className="text-xl font-bold text-text-primary">Akses Terbatas</h2>
        <p className="text-sm text-text-secondary text-center max-w-sm">
          Halaman ini hanya dapat diakses oleh Bendahara, Ketua, dan Sekretaris.
        </p>
        <Button onClick={() => router.push(`/room/${roomId}/kas`)} variant="outline">
          Kembali ke Kas
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
            <h2 className="text-xl font-bold text-text-primary">Kelola Kas</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {canManageKas ? "Kelola pemasukan, pengeluaran, dan tagihan kelas" : "Lihat laporan keuangan kelas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageKas && (
            <Button onClick={() => setShowAddTx(true)}>
              <HiPlus className="h-4 w-4" />
              Tambah Transaksi
            </Button>
          )}
          {canDownloadReport && (
            <Button variant="outline" onClick={handleDownloadExcel}>
              <HiDownload className="h-4 w-4" />
              Download Excel
            </Button>
          )}
        </div>
      </div>

      {/* Ringkasan Keuangan */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary">Total Pemasukan</p>
            <p className="text-2xl font-bold text-success">
              {formatRupiah(newTotalIncome + legacyTx.filter(t => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0))}
            </p>
          </CardBody>
        </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-text-secondary">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-danger">
                  {formatRupiah(newTotalExpense + legacyTx.filter(t => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0))}
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
                    <p className="text-sm text-white/80 font-medium">Saldo Kas</p>
                    <p className="text-2xl font-bold text-white">
                      {formatRupiah(newBalance + kasSummary.saldo)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

      {/* Grafik Keuangan */}
      <FinanceChart
        income={newTotalIncome + legacyTx.filter(t => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0)}
        expense={newTotalExpense + legacyTx.filter(t => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0)}
        balance={newBalance + kasSummary.saldo}
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
                        <p className="text-sm text-text-secondary">Uang Terkumpul</p>
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
                        <p className="text-sm text-text-secondary">Tunggakan</p>
                        <p className="text-2xl font-bold text-warning">{formatRupiah(billingSummary.totalArrears)}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-text-primary">Tabel Pembayaran Tagihan</h3>
                  <span className="text-xs text-text-muted">
                    {billingSummary.paidCount}/{billingSummary.totalPossible} lunas
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
                    title="Belum ada tagihan"
                    description={
                      canManageKas
                        ? "Buat tagihan untuk mulai mencatat pembayaran anggota"
                        : "Bendahara belum membuat tagihan"
                    }
                    action={
                      canManageKas ? (
                        <Button onClick={() => setBillModalOpen(true)}>
                          <HiPlus className="h-4 w-4" />
                          Buat Tagihan
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
                <p className="text-sm text-text-secondary">Pemasukan (Kas Lama)</p>
                <p className="text-2xl font-bold text-success">{formatRupiah(kasSummary.totalPemasukan)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-text-secondary">Pengeluaran (Kas Lama)</p>
                <p className="text-2xl font-bold text-danger">{formatRupiah(kasSummary.totalPengeluaran)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-text-secondary">Saldo (Kas Lama)</p>
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
                <h3 className="font-semibold text-text-primary">Transaksi Baru</h3>
              </CardHeader>
              <CardBody>
                {newTx.length === 0 ? (
                  <EmptyState
                    icon={<HiCash className="h-8 w-8" />}
                    title="Belum ada transaksi"
                    description="Catat pemasukan atau pengeluaran baru"
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
              <h3 className="font-semibold text-text-primary">Riwayat Transaksi (Kas Lama)</h3>
            </CardHeader>
            <CardBody>
              {legacyTx.length === 0 ? (
                <EmptyState
                  icon={<HiCash className="h-8 w-8" />}
                  title="Belum ada transaksi lama"
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
      <Modal isOpen={showAddTx} onClose={() => setShowAddTx(false)} title="Tambah Transaksi Baru">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Tipe</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTxForm({ ...txForm, type: "income" })}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  txForm.type === "income"
                    ? "bg-success-light text-success ring-2 ring-success"
                    : "bg-surface text-text-secondary hover:bg-surface-hover border border-border"
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setTxForm({ ...txForm, type: "expense" })}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  txForm.type === "expense"
                    ? "bg-danger-light text-danger ring-2 ring-danger"
                    : "bg-surface text-text-secondary hover:bg-surface-hover border border-border"
                }`}
              >
                Pengeluaran
              </button>
            </div>
          </div>
          <Input
            label="Jumlah"
            type="number"
            placeholder="0"
            value={txForm.amount || ""}
            onChange={(e) => setTxForm({ ...txForm, amount: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Deskripsi"
            placeholder="Deskripsi transaksi"
            value={txForm.description}
            onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
          />
          <Input
            label="Kategori (opsional)"
            placeholder="Contoh: Iuran, Alat Tulis, dll"
            value={txForm.category}
            onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAddTx(false)}>Batal</Button>
            <Button onClick={handleAddTx}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Hapus Transaksi Baru */}
      <Modal
        isOpen={!!deleteNewTxTarget}
        onClose={() => setDeleteNewTxTarget(null)}
        title="Hapus Transaksi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Apakah Anda yakin ingin menghapus transaksi ini?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteNewTxTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={async () => {
              if (deleteNewTxTarget) {
                await deleteNewTx(deleteNewTxTarget);
                toast.success("Transaksi berhasil dihapus");
                setDeleteNewTxTarget(null);
              }
            }}>Hapus</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Hapus Legacy Transaksi */}
      <Modal
        isOpen={!!legacyDeleteTarget}
        onClose={() => setLegacyDeleteTarget(null)}
        title="Hapus Transaksi (Lama)"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Apakah Anda yakin ingin menghapus transaksi <strong>{legacyDeleteTarget?.description}</strong>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setLegacyDeleteTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={async () => {
              if (legacyDeleteTarget) {
                await deleteLegacyTx(legacyDeleteTarget.id);
                toast.success("Transaksi berhasil dihapus");
                setLegacyDeleteTarget(null);
              }
            }}>Hapus</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}