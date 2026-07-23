"use client";

import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PaymentPeriod, Payment } from "@/types";
import { HiCheck, HiX, HiClock } from "react-icons/hi";
import toast from "react-hot-toast";

interface MemberRow { userId: string; displayName: string; }

interface PaymentTableProps {
  members: MemberRow[];
  periods: PaymentPeriod[];
  payments: Payment[];
  canManage: boolean;
  onToggle: (userId: string, periodId: string, displayName: string) => Promise<void>;
}

interface PaymentCellProps {
  memberId: string;
  periodId: string;
  displayName: string;
  status: "paid" | "pending" | "unpaid";
  canManage: boolean;
  isLoading: boolean;
  onToggle: (userId: string, periodId: string, displayName: string) => void;
}

const PaymentCell = memo(function PaymentCell({ memberId, periodId, displayName, status, canManage, isLoading, onToggle }: PaymentCellProps) {
  const btn = (content: React.ReactNode, cls: string) => (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${cls}`}>{content}</span>
  );

  if (status === "pending" && !canManage) {
    return btn(<HiClock className="h-4 w-4" />, "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400");
  }

  if (canManage) {
    return (
      <button onClick={() => onToggle(memberId, periodId, displayName)} disabled={isLoading}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
          status === "paid"
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/20 hover:bg-emerald-500 hover:text-white"
            : status === "pending"
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/20 hover:bg-amber-500 hover:text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600"
        } disabled:opacity-50 active:scale-90`}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : status === "paid" ? <HiCheck className="h-5 w-5" /> : status === "pending" ? <HiClock className="h-4 w-4" /> : <HiX className="h-4 w-4" />}
      </button>
    );
  }

  return status === "paid"
    ? btn(<HiCheck className="h-5 w-5" />, "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400")
    : btn(<HiX className="h-4 w-4" />, "bg-slate-100 dark:bg-slate-800 text-slate-400");
});

export const PaymentTable = memo(function PaymentTable({ members, periods, payments, canManage, onToggle }: PaymentTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getStatus = useCallback((userId: string, periodId: string): "paid" | "pending" | "unpaid" => {
    return payments.find((p) => p.userId === userId && p.periodId === periodId)?.status || "unpaid";
  }, [payments]);

  const handleToggle = async (userId: string, periodId: string, displayName: string) => {
    if (!canManage) return;
    const key = `${userId}_${periodId}`;
    setTogglingId(key);
    try { await onToggle(userId, periodId, displayName); }
    catch { toast.error("Gagal mengubah status"); }
    finally { setTogglingId(null); }
  };

  const getMemberPaid = (userId: string) => periods.filter((p) => getStatus(userId, p.id) === "paid").length;

  if (periods.length === 0) return null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted">
              <th className="text-left px-4 py-3.5 font-semibold text-text-primary whitespace-nowrap sticky left-0 bg-surface-muted z-10 min-w-[160px]">Anggota</th>
              {periods.map((p) => (
                <th key={p.id} className="text-center px-3 py-3.5 font-semibold text-text-primary whitespace-nowrap">
                  <span className="text-xs bg-surface-hover px-2 py-1 rounded-lg">P{p.periodNumber}</span>
                </th>
              ))}
              <th className="text-center px-4 py-3.5 font-semibold text-text-primary whitespace-nowrap">Lunas</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={periods.length + 2} className="text-center py-10 text-text-muted">Belum ada anggota</td></tr>
            ) : members.map((member, idx) => {
              const total = getMemberPaid(member.userId);
              const isFull = total === periods.length;
              return (
                <motion.tr key={member.userId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.03 }}
                  className={`${idx % 2 === 0 ? "bg-surface" : "bg-surface-muted/50"} hover:bg-surface-hover transition-colors`}>
                  <td className="px-4 py-3.5 font-medium text-text-primary whitespace-nowrap sticky left-0 z-10 bg-inherit">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${isFull ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-slate-400 to-slate-500"}`}>
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                      {member.displayName}
                    </div>
                  </td>
                  {periods.map((period) => {
                    const status = getStatus(member.userId, period.id);
                    const toggleKey = `${member.userId}_${period.id}`;
                    return (
                      <td key={period.id} className="text-center px-3 py-3">
                        <PaymentCell memberId={member.userId} periodId={period.id} displayName={member.displayName}
                          status={status} canManage={canManage} isLoading={togglingId === toggleKey} onToggle={handleToggle} />
                      </td>
                    );
                  })}
                  <td className="text-center px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isFull ? "text-success" : "text-text-muted"}`}>
                      <span className={`w-2 h-2 rounded-full ${isFull ? "bg-success" : "bg-border"}`} />
                      {total}/{periods.length}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {members.length === 0 ? (
          <p className="text-center py-8 text-text-muted">Belum ada anggota</p>
        ) : members.map((member, idx) => {
          const total = getMemberPaid(member.userId);
          const isFull = total === periods.length;
          return (
            <motion.div key={member.userId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.04 }}
              className={`rounded-2xl border border-border p-4 ${isFull ? "bg-success-light/10 border-success/20" : "bg-surface"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${isFull ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-slate-400 to-slate-500"}`}>
                    {member.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-text-primary">{member.displayName}</span>
                </div>
                <span className={`text-sm font-semibold ${isFull ? "text-success" : "text-text-muted"}`}>{total}/{periods.length} lunas</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {periods.map((period) => {
                  const status = getStatus(member.userId, period.id);
                  const toggleKey = `${member.userId}_${period.id}`;
                  return (
                    <div key={period.id} className="flex items-center gap-1.5">
                      <span className="text-xs text-text-muted">P{period.periodNumber}</span>
                      <PaymentCell memberId={member.userId} periodId={period.id} displayName={member.displayName}
                        status={status} canManage={canManage} isLoading={togglingId === toggleKey} onToggle={handleToggle} />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
});
