"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface FinanceChartProps {
  income: number;
  expense: number;
  balance: number;
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function FinanceChart({ income, expense, balance }: FinanceChartProps) {
  const barData = useMemo(
    () => [
      { name: "Pemasukan", amount: income, fill: "#10b981" },
      { name: "Pengeluaran", amount: expense, fill: "#ef4444" },
    ],
    [income, expense]
  );

  const pieData = useMemo(
    () => [
      { name: "Saldo", value: Math.max(balance, 0), color: "#6366f1" },
      { name: "Terpakai", value: expense, color: "#ef4444" },
    ],
    [balance, expense]
  );

  if (income === 0 && expense === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="bg-surface rounded-xl p-4 border border-border">
        <h4 className="text-sm font-semibold text-text-primary mb-4">Perbandingan</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={(value: any) => formatRupiah(Number(value))} contentStyle={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-surface rounded-xl p-4 border border-border">
        <h4 className="text-sm font-semibold text-text-primary mb-2">Komposisi</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
              {pieData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value: string) => (
                <span className="text-xs text-text-secondary">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
