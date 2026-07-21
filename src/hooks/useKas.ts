"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Kas, KasSummary } from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useKas(roomId: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Kas[]>([]);
  const [summary, setSummary] = useState<KasSummary>({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "kas"),
      where("roomId", "==", roomId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Kas)
        );
        setTransactions(data);

        const totalPemasukan = data
          .filter((t) => t.type === "pemasukan")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalPengeluaran = data
          .filter((t) => t.type === "pengeluaran")
          .reduce((sum, t) => sum + t.amount, 0);

        setSummary({
          totalPemasukan,
          totalPengeluaran,
          saldo: totalPemasukan - totalPengeluaran,
        });
        setLoading(false);
      },
      () => {
        setError("Gagal memuat data kas");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [roomId]);

  const addTransaction = async (data: Omit<Kas, "id" | "createdAt">) => {
    if (!user) throw new Error("Harus login");
    const docRef = await addDoc(collection(db, "kas"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const deleteTransaction = async (transactionId: string) => {
    await deleteDoc(doc(db, "kas", transactionId));
  };

  return {
    transactions,
    summary,
    loading,
    error,
    addTransaction,
    deleteTransaction,
  };
}
