"use client";

import { useState, useCallback } from "react";
import {
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserRole } from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useManageMembers(roomId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyAdmin = useCallback(async (): Promise<void> => {
    if (!user) throw new Error("Harus login");
    const q = query(
      collection(db, "rooms", roomId, "members"),
      where("userId", "==", user.id),
      where("role", "==", "admin")
    );
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Hanya admin yang dapat melakukan aksi ini");
  }, [roomId, user]);

  const changeMemberRole = useCallback(
    async (memberDocId: string, newRole: UserRole) => {
      await verifyAdmin();
      setLoading(true);
      setError(null);
      try {
        const memberRef = doc(db, "rooms", roomId, "members", memberDocId);
        await updateDoc(memberRef, { role: newRole });
      } catch {
        setError("Gagal mengubah peran anggota");
        throw new Error("Gagal mengubah peran anggota");
      } finally {
        setLoading(false);
      }
    },
    [roomId, verifyAdmin]
  );

  const removeMember = useCallback(
    async (memberDocId: string, memberUserId: string) => {
      await verifyAdmin();
      setLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, "rooms", roomId, "members", memberDocId));
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);
        const roomData = roomSnap.data();
        if (roomData) {
          const currentIds: string[] = Array.isArray(roomData.memberIds) ? roomData.memberIds : [];
          await updateDoc(roomRef, {
            memberIds: currentIds.filter((id: string) => id !== memberUserId),
          });
        }
      } catch {
        setError("Gagal menghapus anggota");
        throw new Error("Gagal menghapus anggota");
      } finally {
        setLoading(false);
      }
    },
    [roomId, verifyAdmin]
  );

  const makeGuru = useCallback(
    (memberDocId: string) => changeMemberRole(memberDocId, "guru"),
    [changeMemberRole]
  );

  const makeSiswa = useCallback(
    (memberDocId: string) => changeMemberRole(memberDocId, "siswa"),
    [changeMemberRole]
  );

  return {
    loading,
    error,
    changeMemberRole,
    removeMember,
    makeGuru,
    makeSiswa,
  };
}
