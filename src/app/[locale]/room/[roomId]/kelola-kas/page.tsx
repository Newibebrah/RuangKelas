"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence, animate, useInView } from "framer-motion";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { useWallets } from "@/hooks/useWallets";
import { useBilling } from "@/hooks/useBilling";
import { useBatchPayment } from "@/hooks/useBatchPayment";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaymentTable } from "@/components/kas/PaymentTable";
import { VerificationModal } from "@/components/kas/VerificationModal";
import { FinanceChart } from "@/components/kas/FinanceChart";
import { useLocale } from "@/lib/locale-context";
import { formatRupiah } from "@/lib/kas-utils";
import { Payment, Wallet } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  HiPlus,
  HiTrash,
  HiArrowLeft,
  HiExclamationCircle,
  HiCash,
  HiCheckCircle,
  HiClock,
  HiCreditCard,
  HiQrcode,
  HiCog,
  HiChartBar,
  HiDocumentText,
} from "react-icons/hi";

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1] as const,
      onUpdate(latest) { setDisplayed(Math.round(latest)); },
    });
    return () => controls.stop();
  }, [inView, value]);
  return <span ref={ref}>{displayed.toLocaleString("id-ID")}</span>;
}

type TabKey = "pembayaran" | "laporan" | "pengaturan";

export default function KelolaKasPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members, currentRoom } = useRoom();
  const { wallets, loading: wLoading, createWallet, updateWallet, deleteWallet } = useWallets(roomId);
  const { canManageKas, canViewKasManagement, canDownloadReport } = useRoleAccess(roomId);
  const { submitBatch, verifyBatch } = useBatchPayment(roomId);

  const memberCount = members.length;
  const { bill, periods, payments, loading: bLoading, summary: billingSummary, createBill, togglePayment } = useBilling(roomId, memberCount);

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pembayaran");
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState<Payment | null>(null);
  const [walletSettings, setWalletSettings] = useState<Wallet | null>(null);

  const [newWallet, setNewWallet] = useState<{
    name: string; description: string; type: "recurring" | "one-time"; frequency: "weekly" | "monthly";
    amount: number; periodsPerMonth: number; totalPeriods: number;
    paymentType: "qris" | "bank" | "manual"; qrisImageUrl: string; accountNumber: string; accountName: string;
  }>({
    name: "", description: "", type: "recurring", frequency: "monthly",
    amount: 0, periodsPerMonth: 4, totalPeriods: 4,
    paymentType: "manual", qrisImageUrl: "", accountNumber: "", accountName: "",
  });

  const loading = wLoading || bLoading;

  const wallet = wallets.find((w) => w.id === selectedWallet);

  const memberRows = useMemo(
    () => members.map((m) => ({ userId: m.userId, displayName: m.displayName })),
    [members]
  );

  const walletPayments = useMemo(() => {
    if (!wallet) return payments;
    return payments.filter((p) => p.walletId === wallet.id);
  }, [payments, wallet]);

  const walletPeriods = useMemo(() => {
    if (!wallet) return periods;
    return periods.filter((p) => p.walletId === wallet.id);
  }, [periods, wallet]);

  const walletBillAmount = useMemo(() => {
    if (!wallet) return bill?.amount || 0;
    const wBill = bill && bill.walletId === wallet.id ? bill : null;
    return wBill?.amount || 0;
  }, [wallet, bill]);

  const pendingCount = walletPayments.filter((p) => p.status === "pending").length;
  const paidCount = walletPayments.filter((p) => p.status === "paid").length;
  const unpaidCount = walletPayments.filter((p) => p.status === "unpaid").length;
  const totalCollected = paidCount * walletBillAmount;

  const handleCreateWallet = async () => {
    if (!canManageKas) return;
    try {
      await createWallet({
        name: newWallet.name,
        description: newWallet.description,
        type: newWallet.type,
        frequency: newWallet.frequency,
        totalPeriods: newWallet.totalPeriods,
        amount: newWallet.amount,
        periodsPerMonth: newWallet.periodsPerMonth,
        paymentMethod: {
          type: newWallet.paymentType,
          qrisImageUrl: newWallet.qrisImageUrl || undefined,
          accountNumber: newWallet.accountNumber || undefined,
          accountName: newWallet.accountName || undefined,
        },
      });
      toast.success("Wallet berhasil dibuat!");
      setShowCreateWallet(false);
      setNewWallet({ name: "", description: "", type: "recurring", frequency: "monthly", amount: 0, periodsPerMonth: 4, totalPeriods: 4, paymentType: "manual", qrisImageUrl: "", accountNumber: "", accountName: "" });
    } catch {
      toast.error("Gagal membuat wallet");
    }
  };

  const handleVerifyBatch = useCallback(
    async (paymentIds: string[], action: "approve" | "reject") => {
      try {
        await verifyBatch(paymentIds, action);
        toast.success(action === "approve" ? "Pembayaran disetujui!" : "Pembayaran ditolak");
      } catch {
        toast.error("Gagal memverifikasi");
      }
    },
    [verifyBatch]
  );

  const handleDeleteWallet = async () => {
    if (!wallet) return;
    try {
      await deleteWallet(wallet.id);
      setSelectedWallet(null);
      toast.success("Wallet berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus wallet");
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!wallet || !walletSettings) return;
    try {
      await updateWallet(wallet.id, {
        paymentMethod: walletSettings.paymentMethod,
      });
      toast.success("Metode bayar diperbarui");
      setWalletSettings(null);
    } catch {
      toast.error("Gagal memperbarui");
    }
  };

  const pendingGroupedByBatch = useMemo(() => {
    const groups: Record<string, Payment[]> = {};
    walletPayments.filter((p) => p.status === "pending").forEach((p) => {
      const key = p.batchId || p.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [walletPayments]);

  if (!canViewKasManagement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center">
          <HiCash className="h-8 w-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">{t('auth.accessDenied')}</h2>
        <p className="text-sm text-text-secondary text-center max-w-sm">{t('kas.accessDeniedDesc')}</p>
        <Button onClick={() => router.push(`/room/${roomId}/kas`)} variant="outline">
          {t('action.back')} ke {t('nav.kas')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/room/${roomId}/kas`)} className="p-1.5 rounded-xl hover:bg-surface-hover transition-colors">
            <HiArrowLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-text-primary font-heading">
              {selectedWallet ? wallet?.name : t('kas.manage')}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {selectedWallet ? "Detail dompet kas" : t('kas.manageDesc')}
            </p>
          </div>
        </div>
        {!selectedWallet && canManageKas && (
          <Button onClick={() => setShowCreateWallet(true)}>
            <HiPlus className="h-4 w-4" />
            Wallet Baru
          </Button>
        )}
        {selectedWallet && canManageKas && (
          <Button variant="outline" onClick={handleDeleteWallet} className="text-red-500 border-red-200 hover:bg-red-50">
            <HiTrash className="h-4 w-4" />
            Hapus
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedWallet ? (
          <motion.div key="wallet-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {wallets.length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState
                    icon={<HiCash className="h-12 w-12" />}
                    title="Belum ada wallet"
                    description="Buat wallet untuk mulai mengelola tagihan anggota"
                    action={canManageKas ? <Button onClick={() => setShowCreateWallet(true)}><HiPlus className="h-4 w-4" /> Wallet Baru</Button> : undefined}
                  />
                </CardBody>
              </Card>
            ) : (
              wallets.map((w) => {
                const wPaid = payments.filter((p) => p.walletId === w.id && p.status === "paid").length;
                const wTotal = periods.filter((p) => p.walletId === w.id).length;
                const wPending = payments.filter((p) => p.walletId === w.id && p.status === "pending").length;
                return (
                  <motion.button
                    key={w.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedWallet(w.id)}
                    className="w-full text-left p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-text-primary">{w.name}</h3>
                        {w.description && <p className="text-xs text-text-secondary mt-0.5">{w.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          <span>{formatRupiah(walletBillAmount || 0)}/{w.frequency === "weekly" ? "minggu" : "bulan"}</span>
                          <span>{wPaid}/{wTotal} lunas</span>
                          {wPending > 0 && <span className="text-amber-500">{wPending} verifikasi</span>}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl">
                        {w.type === "recurring" ? "Bulanan" : "Sekali"}
                      </span>
                    </div>
                  </motion.button>
                );
              })
            )}
          </motion.div>
        ) : (
          <motion.div key="wallet-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface-hover rounded-2xl w-fit mb-6">
              {(["pembayaran", "laporan", "pengaturan"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-white dark:bg-slate-800 text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {tab === "pembayaran" && <HiCash className="h-4 w-4" />}
                  {tab === "laporan" && <HiChartBar className="h-4 w-4" />}
                  {tab === "pengaturan" && <HiCog className="h-4 w-4" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "pembayaran" && (
                <motion.div key="pembayaran" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Stats */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Card glass><CardBody><p className="text-xs text-text-secondary">Terkumpul</p><p className="text-lg font-bold text-emerald-600">{formatRupiah(totalCollected)}</p></CardBody></Card>
                    <Card glass><CardBody><p className="text-xs text-text-secondary">Lunas</p><p className="text-lg font-bold text-emerald-600">{paidCount}</p></CardBody></Card>
                    <Card glass><CardBody><p className="text-xs text-text-secondary">Pending</p><p className="text-lg font-bold text-amber-600">{pendingCount}</p></CardBody></Card>
                    <Card glass><CardBody><p className="text-xs text-text-secondary">Belum</p><p className="text-lg font-bold text-slate-500">{unpaidCount}</p></CardBody></Card>
                  </div>

                  {/* Pending batches */}
                  {Object.keys(pendingGroupedByBatch).length > 0 && (
                    <Card>
                      <CardHeader><h3 className="font-semibold text-text-primary">Verifikasi Massal</h3></CardHeader>
                      <CardBody className="space-y-2">
                        {Object.entries(pendingGroupedByBatch).map(([batchId, batchPayments]) => (
                          <div key={batchId} className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <HiClock className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                                  {batchPayments.length} pembayaran {batchId.length > 20 ? `(Batch: ${batchId.slice(0, 8)}...)` : ""}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-xs border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => handleVerifyBatch(batchPayments.map((p) => p.id), "reject")}
                                >
                                  Tolak Semua
                                </Button>
                                <Button size="sm" className="text-xs"
                                  onClick={() => handleVerifyBatch(batchPayments.map((p) => p.id), "approve")}
                                >
                                  Setujui Semua
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {batchPayments.map((p) => (
                                <button key={p.id} onClick={() => setVerifyingPayment(p)}
                                  className="px-3 py-1 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 transition-colors"
                                >
                                  {p.displayName}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CardBody>
                    </Card>
                  )}

                  {/* Payment Matrix */}
                  <Card>
                    <CardBody>
                      <h3 className="text-base font-semibold text-text-primary mb-3">Tabel Pembayaran</h3>
                      <PaymentTable
                        members={memberRows}
                        periods={walletPeriods}
                        payments={walletPayments}
                        canManage={canManageKas}
                        onToggle={(userId, periodId, displayName) => togglePayment(userId, periodId, displayName)}
                      />
                    </CardBody>
                  </Card>
                </motion.div>
              )}

              {activeTab === "laporan" && (
                <motion.div key="laporan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <FinanceChart income={totalCollected} expense={0} balance={totalCollected} />
                  <Card>
                    <CardBody>
                      <h3 className="text-base font-semibold text-text-primary mb-3">Ringkasan {wallet?.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-border/40">
                          <span className="text-text-secondary">Total Tagihan</span>
                          <span className="font-semibold text-text-primary">{formatRupiah(walletPeriods.length * memberRows.length * walletBillAmount)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/40">
                          <span className="text-text-secondary">Terkumpul</span>
                          <span className="font-semibold text-emerald-600">{formatRupiah(totalCollected)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-text-secondary">Tunggakan</span>
                          <span className="font-semibold text-red-500">{formatRupiah((walletPeriods.length * memberRows.length - paidCount) * walletBillAmount)}</span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              )}

              {activeTab === "pengaturan" && (
                <motion.div key="pengaturan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card>
                    <CardBody>
                      <h3 className="text-base font-semibold text-text-primary mb-4">Metode Pembayaran</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-text-secondary block mb-2">Tipe</label>
                          <div className="flex gap-2">
                            {(["manual", "bank", "qris"] as const).map((type) => (
                              <button key={type}
                                onClick={() => { if (wallet) setWalletSettings({ ...wallet, paymentMethod: { ...wallet.paymentMethod, type } }); }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                  (walletSettings || wallet)?.paymentMethod.type === type
                                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/30"
                                    : "bg-surface-hover text-text-secondary hover:text-text-primary"
                                }`}
                              >
                                {type === "qris" ? <HiQrcode className="h-4 w-4 inline mr-1" /> : type === "bank" ? <HiCreditCard className="h-4 w-4 inline mr-1" /> : null}
                                {type === "manual" ? "Manual" : type === "bank" ? "Transfer" : "QRIS"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {(walletSettings || wallet)?.paymentMethod.type === "bank" && (
                          <>
                            <div>
                              <label className="text-sm font-medium text-text-secondary block mb-2">Nama Rekening</label>
                              <input value={(walletSettings || wallet)?.paymentMethod.accountName || ""}
                                onChange={(e) => { if (wallet) setWalletSettings({ ...wallet, paymentMethod: { ...wallet.paymentMethod, accountName: e.target.value } }); }}
                                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-text-secondary block mb-2">Nomor Rekening</label>
                              <input value={(walletSettings || wallet)?.paymentMethod.accountNumber || ""}
                                onChange={(e) => { if (wallet) setWalletSettings({ ...wallet, paymentMethod: { ...wallet.paymentMethod, accountNumber: e.target.value } }); }}
                                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                              />
                            </div>
                          </>
                        )}

                        {(walletSettings || wallet)?.paymentMethod.type === "qris" && (
                          <div>
                            <label className="text-sm font-medium text-text-secondary block mb-2">URL Gambar QRIS</label>
                            <input value={(walletSettings || wallet)?.paymentMethod.qrisImageUrl || ""}
                              onChange={(e) => { if (wallet) setWalletSettings({ ...wallet, paymentMethod: { ...wallet.paymentMethod, qrisImageUrl: e.target.value } }); }}
                              placeholder="https://res.cloudinary.com/..."
                              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                            />
                          </div>
                        )}

                        <Button onClick={handleUpdatePaymentMethod}>
                          <HiCog className="h-4 w-4" />
                          Simpan Pengaturan
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Buat Wallet */}
      <Modal isOpen={showCreateWallet} onClose={() => setShowCreateWallet(false)} title="Buat Wallet Baru">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Nama Wallet</label>
            <input value={newWallet.name} onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
              placeholder="Contoh: Iuran Kelas, Sumbangan"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Deskripsi (opsional)</label>
            <input value={newWallet.description} onChange={(e) => setNewWallet({ ...newWallet, description: e.target.value })}
              placeholder="Keperluan apa?"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Tipe</label>
              <select value={newWallet.type} onChange={(e) => setNewWallet({ ...newWallet, type: e.target.value as "recurring" | "one-time" })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="recurring">Bulanan</option>
                <option value="one-time">Sekali</option>
              </select>
            </div>
            {newWallet.type === "recurring" && (
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Frekuensi</label>
                <select value={newWallet.frequency} onChange={(e) => setNewWallet({ ...newWallet, frequency: e.target.value as "weekly" | "monthly" })}
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="monthly">Per Bulan</option>
                  <option value="weekly">Per Minggu</option>
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Jumlah (Rp)</label>
              <input type="number" value={newWallet.amount} onChange={(e) => setNewWallet({ ...newWallet, amount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary block mb-2">Total Periode</label>
              <input type="number" value={newWallet.totalPeriods} onChange={(e) => setNewWallet({ ...newWallet, totalPeriods: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Metode Bayar</label>
            <div className="flex gap-2">
              {(["manual", "bank", "qris"] as const).map((type) => (
                <button key={type} onClick={() => setNewWallet({ ...newWallet, paymentType: type })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    newWallet.paymentType === type
                      ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/30"
                      : "bg-surface-hover text-text-secondary"
                  }`}
                >
                  {type === "manual" ? "Manual" : type === "bank" ? "Transfer" : "QRIS"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreateWallet(false)} className="flex-1">Batal</Button>
            <Button onClick={handleCreateWallet} disabled={!newWallet.name || !newWallet.amount} className="flex-1">
              <HiPlus className="h-4 w-4" />
              Buat
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verification Modal */}
      {verifyingPayment && (
        <VerificationModal
          isOpen
          onClose={() => setVerifyingPayment(null)}
          payment={verifyingPayment}
          period={periods.find((p) => p.id === verifyingPayment.periodId)}
          amount={walletBillAmount}
          walletName={wallet?.name || ""}
          onVerify={handleVerifyBatch}
        />
      )}
    </div>
  );
}
