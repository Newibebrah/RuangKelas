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
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useTransactions(roomId: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "transactions"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "desc"),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Transaction)
        );
        setTransactions(data);
        setLoading(false);
      },
      async () => {
        try {
          const q2 = query(
            collection(db, "transactions"),
            where("roomId", "==", roomId),
            limit(200)
          );
          const snap = await getDocs(q2);
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Transaction)
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
          setTransactions(data);
          setLoading(false);
        } catch {
          setError("Gagal memuat transaksi. Periksa Firestore indexes.");
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [roomId]);

  const addTransaction = async (data: {
    type: "income" | "expense";
    amount: number;
    description: string;
    category?: string;
  }) => {
    if (!user) throw new Error("Harus login");
    const docRef = await addDoc(collection(db, "transactions"), {
      roomId,
      ...data,
      createdBy: user.id,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const deleteTransaction = async (transactionId: string) => {
    await deleteDoc(doc(db, "transactions", transactionId));
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    totalIncome,
    totalExpense,
    balance,
  };
}