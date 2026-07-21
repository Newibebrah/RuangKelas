"use client";

import { memo, useState, useCallback } from "react";
import { PaymentPeriod, Payment } from "@/types";
import { HiCheck, HiX } from "react-icons/hi";
import toast from "react-hot-toast";

interface MemberRow {
  userId: string;
  displayName: string;
}

interface PaymentTableProps {
  members: MemberRow[];
  periods: PaymentPeriod[];
  payments: Payment[];
  canManage: boolean;
  onToggle: (
    userId: string,
    periodId: string,
    displayName: string
  ) => Promise<void>;
}

interface PaymentCellProps {
  memberId: string;
  periodId: string;
  displayName: string;
  paid: boolean;
  canManage: boolean;
  isLoading: boolean;
  onToggle: (userId: string, periodId: string, displayName: string) => void;
}

const PaymentCell = memo(function PaymentCell({
  memberId,
  periodId,
  displayName,
  paid,
  canManage,
  isLoading,
  onToggle,
}: PaymentCellProps) {
  if (canManage) {
    return (
      <button
        onClick={() => onToggle(memberId, periodId, displayName)}
        disabled={isLoading}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
          paid
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : paid ? (
          <HiCheck className="h-5 w-5" />
        ) : (
          <HiX className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
        paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
      }`}
    >
      {paid ? <HiCheck className="h-5 w-5" /> : <HiX className="h-5 w-5" />}
    </span>
  );
});

export const PaymentTable = memo(function PaymentTable({
  members,
  periods,
  payments,
  canManage,
  onToggle,
}: PaymentTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getPayment = useCallback(
    (userId: string, periodId: string) => {
      return payments.find(
        (p) => p.userId === userId && p.periodId === periodId
      );
    },
    [payments]
  );

  const isPaid = useCallback(
    (userId: string, periodId: string) => {
      return getPayment(userId, periodId)?.status === "paid";
    },
    [getPayment]
  );

  const handleToggle = async (
    userId: string,
    periodId: string,
    displayName: string
  ) => {
    if (!canManage) return;
    const key = `${userId}_${periodId}`;
    setTogglingId(key);
    try {
      await onToggle(userId, periodId, displayName);
    } catch {
      toast.error("Gagal mengubah status pembayaran");
    } finally {
      setTogglingId(null);
    }
  };

  const getMemberTotal = (userId: string) => {
    return periods.filter((p) => isPaid(userId, p.id)).length;
  };

  if (periods.length === 0) return null;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-900 whitespace-nowrap min-w-[160px]">
                Anggota
              </th>
              {periods.map((p) => (
                <th
                  key={p.id}
                  className="text-center px-3 py-3 font-semibold text-gray-900 whitespace-nowrap"
                >
                  P{p.periodNumber}
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                Lunas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={periods.length + 2}
                  className="text-center py-8 text-gray-400"
                >
                  Belum ada anggota
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const total = getMemberTotal(member.userId);
                return (
                  <tr key={member.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {member.displayName}
                    </td>
                    {periods.map((period) => {
                      const paid = isPaid(member.userId, period.id);
                      const toggleKey = `${member.userId}_${period.id}`;
                      const isLoading = togglingId === toggleKey;
                      return (
                        <td key={period.id} className="text-center px-3 py-3">
                          <PaymentCell
                            memberId={member.userId}
                            periodId={period.id}
                            displayName={member.displayName}
                            paid={paid}
                            canManage={canManage}
                            isLoading={isLoading}
                            onToggle={handleToggle}
                          />
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3 font-medium text-gray-900">
                      {total}/{periods.length}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {members.length === 0 ? (
          <p className="text-center py-8 text-gray-400">Belum ada anggota</p>
        ) : (
          members.map((member) => {
            const total = getMemberTotal(member.userId);
            return (
              <div key={member.userId} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{member.displayName}</span>
                  <span className="text-sm text-gray-500">
                    {total}/{periods.length} lunas
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {periods.map((period) => {
                    const paid = isPaid(member.userId, period.id);
                    const toggleKey = `${member.userId}_${period.id}`;
                    const isLoading = togglingId === toggleKey;
                    return (
                      <div key={period.id} className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">P{period.periodNumber}</span>
                        <PaymentCell
                          memberId={member.userId}
                          periodId={period.id}
                          displayName={member.displayName}
                          paid={paid}
                          canManage={canManage}
                          isLoading={isLoading}
                          onToggle={handleToggle}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
});
