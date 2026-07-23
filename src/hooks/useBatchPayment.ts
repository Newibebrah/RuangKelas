"use client";

import { useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Payment } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { addNotification } from "@/lib/notifications";

export function useBatchPayment(roomId: string) {
  const { user } = useAuth();

  const submitManual = useCallback(
    async (periodIds: string[]) => {
      if (!user) throw new Error("Harus login");

      const snap = await getDocs(query(collection(db, "payments"), where("roomId", "==", roomId)));
      const matched = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Payment)
        .filter((p) => p.userId === user.id && periodIds.includes(p.periodId) && p.status === "unpaid");

      if (matched.length === 0) throw new Error("Tidak ada periode yang bisa dibayar");

      const batch = writeBatch(db);
      for (const p of matched) {
        batch.update(doc(db, "payments", p.id), {
          status: "paid",
          paidAt: serverTimestamp(),
        });
      }
      await batch.commit();
      return matched.length;
    },
    [roomId, user]
  );

  const submitProof = useCallback(
    async (periodIds: string[], proofUrl: string) => {
      if (!user) throw new Error("Harus login");

      const snap = await getDocs(query(collection(db, "payments"), where("roomId", "==", roomId)));
      const matched = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Payment)
        .filter((p) => p.userId === user.id && periodIds.includes(p.periodId) && p.status !== "paid");

      if (matched.length === 0) throw new Error("Tidak ada periode yang bisa dibayar");

      const batchId = crypto.randomUUID();
      const batch = writeBatch(db);
      for (const p of matched) {
        batch.update(doc(db, "payments", p.id), {
          status: "pending",
          proofUrl,
          batchId,
          paidAt: serverTimestamp(),
        });
      }
      await batch.commit();
      return { batchId, count: matched.length };
    },
    [roomId, user]
  );

  const verifyBatch = useCallback(
    async (paymentIds: string[], action: "approve" | "reject") => {
      if (!user) throw new Error("Harus login");
      const batch = writeBatch(db);

      for (const pid of paymentIds) {
        const ref = doc(db, "payments", pid);
        if (action === "approve") {
          batch.update(ref, {
            status: "paid", paidAt: serverTimestamp(),
            verifiedBy: user.id, verifiedAt: serverTimestamp(),
          });
        } else {
          batch.update(ref, {
            status: "unpaid", proofUrl: null, batchId: "",
            verifiedBy: user.id, verifiedAt: serverTimestamp(),
          });
        }
      }
      await batch.commit();

      const snap = await getDocs(query(collection(db, "payments"), where("roomId", "==", roomId)));
      const allPayments = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment);

      for (const pid of paymentIds) {
        const p = allPayments.find((d) => d.id === pid);
        if (!p) continue;
        addNotification({
          userId: p.userId,
          type: action === "approve" ? "payment_verified" : "payment_rejected",
          title: action === "approve" ? "Pembayaran Disetujui" : "Pembayaran Ditolak",
          message: action === "approve"
            ? "Pembayaran Anda telah diverifikasi"
            : "Pembayaran Anda ditolak, silakan hubungi bendahara",
          roomId, link: `/room/${roomId}/kas`,
        });
      }
    },
    [roomId, user]
  );

  return { submitManual, submitProof, verifyBatch };
}
