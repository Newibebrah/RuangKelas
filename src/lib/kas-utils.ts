import { Kas, Transaction } from "@/types";
import { Timestamp } from "firebase/firestore";

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getLegacyIncome(tx: Kas[]): number {
  return tx.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0);
}

export function getLegacyExpense(tx: Kas[]): number {
  return tx.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0);
}

export function getLegacyBalance(tx: Kas[]): number {
  return getLegacyIncome(tx) - getLegacyExpense(tx);
}

export function combineKas(
  legacyTx: Kas[],
  newTx: Transaction[]
): {
  combinedIncome: number;
  combinedExpense: number;
  combinedBalance: number;
} {
  const li = getLegacyIncome(legacyTx);
  const le = getLegacyExpense(legacyTx);
  const ni = newTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const ne = newTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return {
    combinedIncome: li + ni,
    combinedExpense: le + ne,
    combinedBalance: li - le + ni - ne,
  };
}

export type NormalizedTx = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  date: Date;
  source: "lama" | "baru";
  displayName?: string;
};

export function normalizeTransactions(
  legacyTx: Kas[],
  newTx: Transaction[]
): NormalizedTx[] {
  const result: NormalizedTx[] = [];

  legacyTx.forEach((t) => {
    result.push({
      id: t.id,
      type: t.type === "pemasukan" ? "income" : "expense",
      amount: t.amount,
      description: t.description,
      category: t.category,
      date: toDate(t.date || t.createdAt),
      source: "lama",
      displayName: t.displayName,
    });
  });

  newTx.forEach((t) => {
    result.push({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      category: t.category,
      date: toDate(t.createdAt),
      source: "baru",
    });
  });

  return result.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function toDate(ts: Timestamp | undefined): Date {
  if (!ts) return new Date();
  return ts.toDate?.() || new Date();
}
