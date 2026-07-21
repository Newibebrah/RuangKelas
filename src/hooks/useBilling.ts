"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bill, PaymentPeriod, Payment } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { notifyAllMembers } from "@/lib/notifications";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { billingKeys } from "@/lib/query-keys";

export function useBilling(roomId: string, memberCount?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bill, setBill] = useState<Bill | null>(null);
  const [periods, setPeriods] = useState<PaymentPeriod[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "bills"),
      where("roomId", "==", roomId),
      where("isActive", "==", true)
    );

    const unsubBill = onSnapshot(
      q,
      (snapshot) => {
        const bills = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Bill
        );
        const activeBill = bills[0] || null;
        setBill(activeBill);
        queryClient.setQueryData(billingKeys.bill(roomId), activeBill);
      },
      () => setError("Gagal memuat tagihan. Periksa Firestore indexes.")
    );

    return unsubBill;
  }, [roomId, queryClient]);

  useEffect(() => {
    if (!bill?.id) return;

    const q = query(
      collection(db, "paymentPeriods"),
      where("billId", "==", bill.id),
      orderBy("periodNumber", "asc")
    );

    const unsubPeriods = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as PaymentPeriod
        );
        setPeriods(data);
        setLoading(false);
        queryClient.setQueryData(billingKeys.periods(bill.id), data);
      },
      async () => {
        try {
          const q2 = query(collection(db, "paymentPeriods"), where("billId", "==", bill.id));
          const snap = await getDocs(q2);
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as PaymentPeriod)
            .sort((a, b) => a.periodNumber - b.periodNumber);
          setPeriods(data);
          setLoading(false);
          queryClient.setQueryData(billingKeys.periods(bill.id), data);
        } catch {
          setError("Gagal memuat periode. Periksa Firestore indexes.");
          setLoading(false);
        }
      }
    );

    return unsubPeriods;
  }, [bill?.id, queryClient]);

  useEffect(() => {
    if (!bill?.id) return;

    const q = query(
      collection(db, "payments"),
      where("billId", "==", bill.id),
      limit(2000)
    );

    const unsubPayments = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Payment
        );
        setPayments(data);
        setLoading(false);
        queryClient.setQueryData(billingKeys.payments(bill.id), data);
      },
      () => {
        setError("Gagal memuat pembayaran");
        setLoading(false);
      }
    );

    return unsubPayments;
  }, [bill?.id, queryClient]);

  const createBill = useCallback(
    async (data: {
      amount: number;
      frequency: "weekly" | "monthly";
      periodsPerMonth: number;
    }) => {
      if (!user) throw new Error("Harus login");

      const billRef = await addDoc(collection(db, "bills"), {
        roomId,
        ...data,
        createdBy: user.id,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      const now = new Date();
      const periodRefs = [];
      for (let i = 1; i <= data.periodsPerMonth; i++) {
        const dueDate = new Date(now);
        dueDate.setDate(
          dueDate.getDate() + Math.round((i / data.periodsPerMonth) * 30)
        );
        const ref = await addDoc(collection(db, "paymentPeriods"), {
          billId: billRef.id,
          roomId,
          periodNumber: i,
          dueDate: Timestamp.fromDate(dueDate),
          status: "open",
        });
        periodRefs.push(ref);
      }

      const membersSnap = await getDocs(
        collection(db, "rooms", roomId, "members")
      );
      const memberList = membersSnap.docs.map((d) => ({
        userId: d.data().userId as string,
        displayName: d.data().displayName as string,
      }));

      for (const periodRef of periodRefs) {
        for (const member of memberList) {
          await addDoc(collection(db, "payments"), {
            billId: billRef.id,
            periodId: periodRef.id,
            roomId,
            userId: member.userId,
            displayName: member.displayName,
            status: "unpaid",
            paidAt: null,
          });
        }
      }

      await notifyAllMembers(roomId, {
        type: "bill",
        title: "Tagihan Baru",
        message: `Tagihan Rp ${data.amount.toLocaleString("id-ID")} telah dibuat`,
        roomId,
        link: `/room/${roomId}/kas`,
      });

      return billRef.id;
    },
    [roomId, user]
  );

  const mutation = useMutation({
    mutationFn: async ({ userId, periodId, displayName, billId }: { userId: string; periodId: string; displayName: string; billId: string }) => {
      const existing = payments.find(
        (p) => p.userId === userId && p.periodId === periodId
      );

      if (existing) {
        const newStatus = existing.status === "paid" ? "unpaid" : "paid";
        await updateDoc(doc(db, "payments", existing.id), {
          status: newStatus,
          paidAt: newStatus === "paid" ? serverTimestamp() : null,
        });
      } else {
        await addDoc(collection(db, "payments"), {
          billId,
          periodId,
          roomId,
          userId,
          displayName,
          status: "paid",
          paidAt: serverTimestamp(),
        });
      }
    },
    onMutate: async ({ userId, periodId, billId }) => {
      await queryClient.cancelQueries({ queryKey: billingKeys.payments(billId) });
      const previous = queryClient.getQueryData(billingKeys.payments(billId));
      queryClient.setQueryData(billingKeys.payments(billId), (old: Payment[] | undefined) => {
        if (!old) return old;
        return old.map(p =>
          p.userId === userId && p.periodId === periodId
            ? { ...p, status: p.status === 'paid' ? 'unpaid' : 'paid', paidAt: p.status === 'paid' ? null : Timestamp.now() }
            : p
        );
      });
      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(billingKeys.payments(vars.billId), context.previous);
      }
    },
    onSettled: (data, err, vars) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.payments(vars.billId) });
    },
  });

  const togglePayment = useCallback(
    async (userId: string, periodId: string, displayName: string) => {
      if (!bill) throw new Error("Tidak ada tagihan aktif");
      try {
        await mutation.mutateAsync({ userId, periodId, displayName, billId: bill.id });
      } catch (error) {
        throw error;
      }
    },
    [mutation, bill]
  );

  const summary = useMemo(() => {
    if (!bill || periods.length === 0) {
      return {
        totalCollected: 0,
        totalArrears: 0,
        paidCount: 0,
        totalPossible: 0,
      };
    }
    const totalPeriods = periods.length;
    const actualMemberCount = memberCount || new Set(payments.map((p) => p.userId)).size;
    const totalPossible = actualMemberCount * totalPeriods;
    const paidCount = payments.filter((p) => p.status === "paid").length;
    return {
      totalCollected: paidCount * bill.amount,
      totalArrears: (totalPossible - paidCount) * bill.amount,
      paidCount,
      totalPossible,
    };
  }, [bill, periods, payments, memberCount]);

  return {
    bill,
    periods,
    payments,
    loading,
    error,
    summary,
    createBill,
    togglePayment,
  };
}
