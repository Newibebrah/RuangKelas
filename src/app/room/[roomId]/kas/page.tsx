"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { useKas } from "@/hooks/useKas";
import { useBilling } from "@/hooks/useBilling";
import { usePengurus } from "@/hooks/usePengurus";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { BillSetupModal } from "@/components/kas/BillSetupModal";
import { PaymentTable } from "@/components/kas/PaymentTable";
import { MemberProgressCard } from "@/components/kas/MemberProgressCard";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  HiCash,
  HiPlus,
  HiDocumentText,
  HiCurrencyDollar,
  HiExclamationCircle,
} from "react-icons/hi";

export default function KasPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members, subscribeMembers } = useRoom();
  const { pengurus } = usePengurus(roomId);
  const {
    transactions,
    summary: kasSummary,
    loading: kasLoading,
    error: kasError,
  } = useKas(roomId);
  const {
    bill,
    periods,
    payments,
    loading: billingLoading,
    error: billingError,
    summary: billingSummary,
    createBill,
    togglePayment,
  } = useBilling(roomId);

  useEffect(() => {
    const unsub = subscribeMembers(roomId);
    return () => unsub();
  }, [roomId, subscribeMembers]);

  const [billModalOpen, setBillModalOpen] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";
  const isBendahara = pengurus.some(
    (p) => p.userId === user?.id && p.jabatan.toLowerCase() === "bendahara"
  );
  const canManageBilling = isAdmin || isBendahara;

  const memberRows = useMemo(
    () =>
      members.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
      })),
    [members]
  );

  const userPaidCount = payments.filter(
    (p) => p.userId === user?.id && p.status === "paid"
  ).length;

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const loading = billingLoading || kasLoading;
  const hasError = billingError || kasError;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kas Kelas</h2>
          <p className="text-sm text-gray-500 mt-1">
            {bill
              ? `Tagihan aktif: ${formatRupiah(bill.amount)}/${bill.frequency === "weekly" ? "minggu" : "bulan"}`
              : "Kelola tagihan dan kas kelas"}
          </p>
        </div>
        {canManageBilling && !bill && (
          <Button onClick={() => setBillModalOpen(true)}>
            <HiPlus className="h-4 w-4 mr-1" />
            Buat Tagihan
          </Button>
        )}
      </div>

      {/* Billing Section */}
      {loading ? (
        <LoadingSpinner size="lg" message="Memuat data kas..." />
      ) : hasError ? (
        <ErrorMessage message={billingError || kasError || ""} />
      ) : (
        <>
          {bill && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 mb-6">
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <HiCurrencyDollar className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Uang Terkumpul
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatRupiah(billingSummary.totalCollected)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <HiExclamationCircle className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tunggakan</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {formatRupiah(billingSummary.totalArrears)}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {canManageBilling
                      ? "Tabel Pembayaran"
                      : "Status Pembayaran Anggota"}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {billingSummary.paidCount}/{billingSummary.totalPossible} lunas
                  </span>
                </div>
                <PaymentTable
                  members={memberRows}
                  periods={periods}
                  payments={payments}
                  canManage={canManageBilling}
                  onToggle={togglePayment}
                />
              </div>

              {!canManageBilling && user && (
                <div className="mb-6">
                  <MemberProgressCard
                    displayName={user.displayName}
                    paidCount={userPaidCount}
                    totalPeriods={periods.length}
                    amount={bill.amount}
                  />
                </div>
              )}
            </>
          )}

          {!bill && !billingLoading && (
            <div className="mb-6">
              <Card>
                <CardBody>
                  <EmptyState
                    icon={<HiDocumentText className="h-16 w-16" />}
                    title="Belum ada tagihan"
                    description={
                      canManageBilling
                        ? "Buat tagihan untuk mulai mencatat pembayaran anggota"
                        : "Bendahara belum membuat tagihan"
                    }
                    action={
                      canManageBilling ? (
                        <Button onClick={() => setBillModalOpen(true)}>
                          <HiPlus className="h-4 w-4 mr-1" />
                          Buat Tagihan
                        </Button>
                      ) : undefined
                    }
                  />
                </CardBody>
              </Card>
            </div>
          )}

          {/* Traditional Kas Section */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card>
              <CardBody>
                <p className="text-sm text-gray-500">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatRupiah(kasSummary.totalPemasukan)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-500">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatRupiah(kasSummary.totalPengeluaran)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-gray-500">Saldo Kas</p>
                <p
                  className={`text-2xl font-bold ${
                    kasSummary.saldo >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {formatRupiah(kasSummary.saldo)}
                </p>
              </CardBody>
            </Card>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              icon={<HiCash className="h-16 w-16" />}
              title="Belum ada transaksi"
              description="Catat transaksi pertama kas kelas"
            />
          ) : (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">
                  Riwayat Transaksi
                </h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {transactions.map((trx) => (
                    <div
                      key={trx.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {trx.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {trx.displayName} &middot;{" "}
                          {format(trx.date.toDate(), "dd MMM yyyy", {
                            locale: id,
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ${
                          trx.type === "pemasukan"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {trx.type === "pemasukan" ? "+" : "-"}
                        {formatRupiah(trx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      <BillSetupModal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        onSubmit={async (data) => {
          await createBill(data);
        }}
      />
    </div>
  );
}
