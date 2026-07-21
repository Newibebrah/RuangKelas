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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SubjectPJ } from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useSubjectPJ(roomId: string) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectPJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "subjectPJ"),
      where("roomId", "==", roomId),
      orderBy("subjectName", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as SubjectPJ
        );
        setSubjects(data);
        setLoading(false);
      },
      () => {
        setError("Gagal memuat data PJ");
        setLoading(false);
      }
    );

    return unsub;
  }, [roomId]);

  const addSubject = useCallback(
    async (subjectName: string) => {
      if (!user) throw new Error("Harus login");
      await addDoc(collection(db, "subjectPJ"), {
        roomId,
        subjectName,
        userId: null,
        displayName: null,
      });
    },
    [roomId, user]
  );

  const assignPJ = useCallback(
    async (
      subjectId: string,
      userId: string | null,
      displayName: string | null
    ) => {
      await updateDoc(doc(db, "subjectPJ", subjectId), { userId, displayName });
    },
    []
  );

  const deleteSubject = useCallback(async (subjectId: string) => {
    await deleteDoc(doc(db, "subjectPJ", subjectId));
  }, []);

  return { subjects, loading, error, addSubject, assignPJ, deleteSubject };
}
