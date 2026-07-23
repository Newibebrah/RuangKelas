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

export interface WalletWithData {
  wallet: Wallet;
  bill: Bill | null;
  periods: PaymentPeriod[];
  payments: Payment[];
}

export function useWallets(roomId: string) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [periods, setPeriods] = useState<PaymentPeriod[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);

    const unsubWallets = onSnapshot(
      query(collection(db, "wallets"), where("roomId", "==", roomId)),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Wallet);
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setWallets(data);
        setLoading(false);
      },
      (err) => {
        console.error("wallets error:", err);
        setError("Gagal memuat dompet kas"); setLoading(false);
      }
    );

    const unsubBills = onSnapshot(
      query(collection(db, "bills"), where("roomId", "==", roomId)),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bill);
        setBills(data.filter((b) => b.isActive));
        setLoading(false);
      },
      (err) => {
        console.error("bills error:", err);
        setError("Gagal memuat tagihan"); setLoading(false);
      }
    );

    const unsubPeriods = onSnapshot(
      collection(db, "paymentPeriods"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentPeriod);
        setPeriods(data.filter((p) => p.roomId === roomId));
        setLoading(false);
      },
      (err) => {
        console.error("periods error:", err);
        setError("Gagal memuat periode"); setLoading(false);
      }
    );

    const unsubPayments = onSnapshot(
      collection(db, "payments"),
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);
        setPayments(data.filter((p) => p.roomId === roomId));
        setLoading(false);
      },
      (err) => {
        console.error("payments error:", err);
        setError("Gagal memuat pembayaran"); setLoading(false);
      }
    );

    return () => { unsubWallets(); unsubBills(); unsubPeriods(); unsubPayments(); };
  }, [roomId]);

  const getWalletData = useCallback(
    (walletId: string): WalletWithData => {
      const wallet = wallets.find((w) => w.id === walletId)!;
      const bill = bills.find((b) => b.walletId === walletId) || null;
      const walletPeriods = periods.filter((p) => p.walletId === walletId);
      const walletPayments = payments.filter((p) => p.walletId === walletId);
      return { wallet, bill, periods: walletPeriods, payments: walletPayments };
    },
    [wallets, bills, periods, payments]
  );

  const walletsWithData = wallets.map((w) => getWalletData(w.id));

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
        startDate: null, endDate: null,
        paymentMethod: data.paymentMethod,
        createdBy: user.id,
        createdAt: serverTimestamp(),
      });

      const billRef = doc(collection(db, "bills"));
      batch.set(billRef, {
        roomId, walletId: walletRef.id,
        amount: data.amount, frequency: data.frequency || "monthly",
        periodsPerMonth: data.periodsPerMonth,
        createdBy: user.id, createdAt: serverTimestamp(), isActive: true,
      });

      const now = new Date();
      const periodIds: string[] = [];
      const total = data.totalPeriods || data.periodsPerMonth;
      for (let i = 1; i <= total; i++) {
        const periodRef = doc(collection(db, "paymentPeriods"));
        const dueDate = new Date(now);
        if (data.frequency === "weekly") dueDate.setDate(dueDate.getDate() + i * 7);
        else dueDate.setDate(dueDate.getDate() + Math.round((i / total) * 30));
        batch.set(periodRef, {
          billId: billRef.id, walletId: walletRef.id, roomId,
          periodNumber: i, dueDate: Timestamp.fromDate(dueDate), status: "open",
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
            billId: billRef.id, walletId: walletRef.id, periodId, roomId,
            userId: member.userId, displayName: member.displayName,
            status: "unpaid", paidAt: null,
          });
        }
      }

      await batch.commit();

      await notifyAllMembers(roomId, {
        type: "bill", title: "Tagihan Baru",
        message: `Tagihan "${data.name}" Rp ${data.amount.toLocaleString("id-ID")} telah dibuat`,
        roomId, link: `/room/${roomId}/kas`,
      });

      return walletRef.id;
    },
    [roomId, user]
  );

  const updateWallet = useCallback(async (walletId: string, data: Partial<Wallet>) => {
    await updateDoc(doc(db, "wallets", walletId), data);
  }, []);

  const deleteWallet = useCallback(async (walletId: string) => {
    const batchW = writeBatch(db);
    batchW.delete(doc(db, "wallets", walletId));
    const billsSnap = await getDocs(query(collection(db, "bills"), where("walletId", "==", walletId)));
    for (const billDoc of billsSnap.docs) {
      batchW.delete(billDoc.ref);
      const periodsSnap = await getDocs(query(collection(db, "paymentPeriods"), where("billId", "==", billDoc.id)));
      for (const pDoc of periodsSnap.docs) batchW.delete(pDoc.ref);
      const paymentsSnap = await getDocs(query(collection(db, "payments"), where("billId", "==", billDoc.id)));
      for (const payDoc of paymentsSnap.docs) batchW.delete(payDoc.ref);
    }
    await batchW.commit();
  }, []);

  return { wallets, walletsWithData, bills, periods, payments, loading, error, createWallet, updateWallet, deleteWallet, getWalletData };
}
