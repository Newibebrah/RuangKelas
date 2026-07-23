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
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Wallet, Bill, PaymentPeriod, Payment } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { notifyAllMembers } from "@/lib/notifications";

export function useWallets(roomId: string) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "wallets"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setWallets(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Wallet));
        setLoading(false);
      },
      () => {
        setError("Gagal memuat dompet kas");
        setLoading(false);
      }
    );
    return unsub;
  }, [roomId]);

  const createWallet = useCallback(
    async (data: {
      name: string;
      description?: string;
      type: "recurring" | "one-time";
      frequency?: "weekly" | "monthly";
      totalPeriods?: number;
      amount: number;
      periodsPerMonth: number;
      paymentMethod: { type: "qris" | "bank" | "manual"; qrisImageUrl?: string; accountNumber?: string; accountName?: string };
    }) => {
      if (!user) throw new Error("Harus login");
      const batch = writeBatch(db);

      const walletRef = doc(collection(db, "wallets"));
      batch.set(walletRef, {
        roomId,
        name: data.name,
        description: data.description || "",
        type: data.type,
        frequency: data.frequency || null,
        totalPeriods: data.totalPeriods || null,
        startDate: null,
        endDate: null,
        paymentMethod: data.paymentMethod,
        createdBy: user.id,
        createdAt: serverTimestamp(),
      });

      const billRef = doc(collection(db, "bills"));
      batch.set(billRef, {
        roomId,
        walletId: walletRef.id,
        amount: data.amount,
        frequency: data.frequency || "monthly",
        periodsPerMonth: data.periodsPerMonth,
        createdBy: user.id,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      const now = new Date();
      const periodIds: string[] = [];
      const total = data.totalPeriods || data.periodsPerMonth;
      for (let i = 1; i <= total; i++) {
        const periodRef = doc(collection(db, "paymentPeriods"));
        const dueDate = new Date(now);
        if (data.frequency === "weekly") {
          dueDate.setDate(dueDate.getDate() + i * 7);
        } else {
          dueDate.setDate(dueDate.getDate() + Math.round((i / total) * 30));
        }
        batch.set(periodRef, {
          billId: billRef.id,
          walletId: walletRef.id,
          roomId,
          periodNumber: i,
          dueDate: Timestamp.fromDate(dueDate),
          status: "open",
        });
        periodIds.push(periodRef.id);
      }

      const membersSnap = await getDocs(collection(db, "rooms", roomId, "members"));
      const memberList = membersSnap.docs.map((d) => ({
        userId: d.data().userId as string,
        displayName: d.data().displayName as string,
      }));

      for (const periodId of periodIds) {
        for (const member of memberList) {
          const paymentRef = doc(collection(db, "payments"));
          batch.set(paymentRef, {
            billId: billRef.id,
            walletId: walletRef.id,
            periodId,
            roomId,
            userId: member.userId,
            displayName: member.displayName,
            status: "unpaid",
            paidAt: null,
          });
        }
      }

      await batch.commit();

      await notifyAllMembers(roomId, {
        type: "bill",
        title: "Tagihan Baru",
        message: `Tagihan "${data.name}" Rp ${data.amount.toLocaleString("id-ID")} telah dibuat`,
        roomId,
        link: `/room/${roomId}/kas`,
      });

      return walletRef.id;
    },
    [roomId, user]
  );

  const updateWallet = useCallback(
    async (walletId: string, data: Partial<Wallet>) => {
      await updateDoc(doc(db, "wallets", walletId), {
        ...data,
      });
    },
    []
  );

  const deleteWallet = useCallback(
    async (walletId: string) => {
      const batch = writeBatch(db);
      batch.delete(doc(db, "wallets", walletId));

      const billsSnap = await getDocs(query(collection(db, "bills"), where("walletId", "==", walletId)));
      for (const billDoc of billsSnap.docs) {
        batch.delete(billDoc.ref);
        const periodsSnap = await getDocs(query(collection(db, "paymentPeriods"), where("billId", "==", billDoc.id)));
        for (const pDoc of periodsSnap.docs) {
          batch.delete(pDoc.ref);
        }
        const paymentsSnap = await getDocs(query(collection(db, "payments"), where("billId", "==", billDoc.id)));
        for (const payDoc of paymentsSnap.docs) {
          batch.delete(payDoc.ref);
        }
      }

      await batch.commit();
    },
    []
  );

  return { wallets, loading, error, createWallet, updateWallet, deleteWallet };
}
