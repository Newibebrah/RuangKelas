"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Subject } from "@/types";
import { useAuth } from "@/lib/auth-context";

const DAY_ORDER: Record<string, number> = {
  Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7,
};

function sortSubjects(list: Subject[]) {
  return [...list].sort((a, b) => {
    const da = DAY_ORDER[a.day] ?? 99;
    const db_ = DAY_ORDER[b.day] ?? 99;
    if (da !== db_) return da - db_;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function useSubjects(roomId: string) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "subjects"),
      where("roomId", "==", roomId)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Subject
        );
        setSubjects(sortSubjects(data));
        setLoading(false);
      },
      async () => {
        try {
          const snap = await getDocs(q);
          const data = snap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Subject
          );
          setSubjects(sortSubjects(data));
          setLoading(false);
        } catch {
          setError("Gagal memuat jadwal matkul");
          setLoading(false);
        }
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
      await addDoc(collection(db, "subjects"), {
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
      await updateDoc(doc(db, "subjects", subjectId), data);
    },
    []
  );

  const deleteSubject = useCallback(async (subjectId: string) => {
    await deleteDoc(doc(db, "subjects", subjectId));
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
