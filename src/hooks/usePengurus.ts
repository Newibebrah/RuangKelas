"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Pengurus } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { addNotification } from "@/lib/notifications";

export function usePengurus(roomId: string) {
  const { user } = useAuth();
  const [pengurus, setPengurus] = useState<Pengurus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "pengurus"),
      where("roomId", "==", roomId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Pengurus)
        );
        setPengurus(data);
        setLoading(false);
      },
      () => {
        setError("Gagal memuat data pengurus");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [roomId]);

  const addPengurus = async (data: Omit<Pengurus, "id" | "createdAt" | "updatedAt">) => {
    if (!user) throw new Error("Harus login");
    const docRef = await addDoc(collection(db, "pengurus"), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updatePengurus = async (
    pengurusId: string,
    data: Partial<Pengurus>
  ) => {
    await updateDoc(doc(db, "pengurus", pengurusId), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    if (data.jabatan) {
      const snap = await getDoc(doc(db, "pengurus", pengurusId));
      const p = snap.data();
      if (p) {
        await addNotification({
          userId: p.userId,
          type: "role",
          title: "Peran Berubah",
          message: `Peran Anda diubah menjadi ${data.jabatan}`,
          roomId: p.roomId,
          link: `/room/${p.roomId}/pengurus`,
        });
      }
    }
  };

  const deletePengurus = async (pengurusId: string) => {
    await deleteDoc(doc(db, "pengurus", pengurusId));
  };

  return {
    pengurus,
    loading,
    error,
    addPengurus,
    updatePengurus,
    deletePengurus,
  };
}
