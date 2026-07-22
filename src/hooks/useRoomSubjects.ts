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
import { RoomSubject } from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useRoomSubjects(roomId: string) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<RoomSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "roomSubjects"),
      where("roomId", "==", roomId),
      orderBy("day", "asc"),
      orderBy("startTime", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as RoomSubject
        );
        setSubjects(data);
        setLoading(false);
      },
      () => {
        setError("Gagal memuat jadwal matkul");
        setLoading(false);
      }
    );

    return unsub;
  }, [roomId]);

  const addSubject = useCallback(
    async (data: {
      name: string;
      day: string;
      startTime: string;
      endTime: string;
      teacher?: string;
      color?: string;
    }) => {
      if (!user) throw new Error("Harus login");
      await addDoc(collection(db, "roomSubjects"), {
        roomId,
        ...data,
        createdBy: user.id,
        createdAt: serverTimestamp(),
      });
    },
    [roomId, user]
  );

  const updateSubject = useCallback(
    async (
      subjectId: string,
      data: Partial<{
        name: string;
        day: string;
        startTime: string;
        endTime: string;
        teacher: string;
        color: string;
      }>
    ) => {
      await updateDoc(doc(db, "roomSubjects", subjectId), data);
    },
    []
  );

  const deleteSubject = useCallback(async (subjectId: string) => {
    await deleteDoc(doc(db, "roomSubjects", subjectId));
  }, []);

  return {
    subjects,
    loading,
    error,
    addSubject,
    updateSubject,
    deleteSubject,
  };
}
