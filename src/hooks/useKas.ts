"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Kas, KasSummary } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { kasKeys } from "@/lib/query-keys";

export function useKas(roomId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
      orderBy("date", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Kas)
        );
        processData(data);
      },
      async () => {
        try {
          const q2 = query(collection(db, "kas"), where("roomId", "==", roomId), limit(200));
          const snap = await getDocs(q2);
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Kas)
            .sort((a, b) => {
              const aTime = a.date?.toMillis?.() || 0;
              const bTime = b.date?.toMillis?.() || 0;
              return bTime - aTime;
            });
          processData(data);
        } catch {
          setError("Gagal memuat data kas. Periksa Firestore indexes.");
          setLoading(false);
        }
      }
    );

    function processData(data: Kas[]) {
      setTransactions(data);

      const totalPemasukan = data
        .filter((t) => t.type === "pemasukan")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalPengeluaran = data
        .filter((t) => t.type === "pengeluaran")
        .reduce((sum, t) => sum + t.amount, 0);

      const summaryData = {
        totalPemasukan,
        totalPengeluaran,
        saldo: totalPemasukan - totalPengeluaran,
      };

      setSummary(summaryData);
      setLoading(false);

      queryClient.setQueryData(kasKeys.all(roomId), {
        transactions: data,
        summary: summaryData,
      });
    }

    return unsubscribe;
  }, [roomId, queryClient]);

  const addTransaction = async (data: Omit<Kas, "id" | "createdAt">) => {
    if (!user) throw new Error("Harus login");
    const docRef = await addDoc(collection(db, "kas"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateTransaction = async (
    transactionId: string,
    data: Partial<Omit<Kas, "id" | "createdAt">>
  ) => {
    await updateDoc(doc(db, "kas", transactionId), data);
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
    updateTransaction,
    deleteTransaction,
  };
}
