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

  const submitBatch = useCallback(
    async (periodIds: string[], proofUrl: string) => {
      if (!user) throw new Error("Harus login");

      const paymentsSnap = await getDocs(
        query(
          collection(db, "payments"),
          where("roomId", "==", roomId),
          where("userId", "==", user.id),
          where("periodId", "in", periodIds)
        )
      );

      const batchId = crypto.randomUUID();
      const batch = writeBatch(db);
      let updatedCount = 0;

      for (const payDoc of paymentsSnap.docs) {
        const data = payDoc.data() as Payment;
        if (data.status === "paid") continue;
        batch.update(payDoc.ref, {
          status: "pending",
          proofUrl,
          batchId,
          paidAt: serverTimestamp(),
        });
        updatedCount++;
      }

      if (updatedCount === 0) throw new Error("Semua periode sudah lunas");
      await batch.commit();
      return { batchId, updatedCount };
    },
    [roomId, user]
  );

  const verifyBatch = useCallback(
    async (paymentIds: string[], action: "approve" | "reject") => {
      if (!user) throw new Error("Harus login");
      const batch = writeBatch(db);

      for (const paymentId of paymentIds) {
        const ref = doc(db, "payments", paymentId);
        if (action === "approve") {
          batch.update(ref, {
            status: "paid",
            paidAt: serverTimestamp(),
            verifiedBy: user.id,
            verifiedAt: serverTimestamp(),
          });
        } else {
          batch.update(ref, {
            status: "unpaid",
            proofUrl: null,
            batchId: "",
            verifiedBy: user.id,
            verifiedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();

      for (const paymentId of paymentIds) {
        const paySnap = await getDocs(
          query(collection(db, "payments"), where("__name__", "==", paymentId))
        );
        paySnap.forEach((d) => {
          const p = d.data() as Payment;
          addNotification({
            userId: p.userId,
            type: action === "approve" ? "payment_verified" : "payment_rejected",
            title: action === "approve" ? "Pembayaran Disetujui" : "Pembayaran Ditolak",
            message:
              action === "approve"
                ? `Pembayaran Anda senilai telah diverifikasi`
                : "Pembayaran Anda ditolak, silakan upload ulang bukti",
            roomId,
            link: `/room/${roomId}/kas`,
          });
        });
      }
    },
    [roomId, user]
  );

  return { submitBatch, verifyBatch };
}
