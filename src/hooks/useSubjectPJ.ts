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
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SubjectPJ } from "@/types";
import { useAuth } from "@/lib/auth-context";

export function useSubjectPJ(roomId: string) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectPJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSubjectPJByName = useCallback(async (subjectName: string) => {
    const snap = await getDocs(
      query(
        collection(db, "subjectPJ"),
        where("roomId", "==", roomId),
        where("subjectName", "==", subjectName)
      )
    );
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as SubjectPJ;
  }, [roomId]);

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
      async () => {
        try {
          const q2 = query(collection(db, "subjectPJ"), where("roomId", "==", roomId));
          const snap = await getDocs(q2);
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as SubjectPJ)
            .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
          setSubjects(data);
          setLoading(false);
        } catch {
          setError("Gagal memuat data PJ. Periksa Firestore indexes.");
          setLoading(false);
        }
      }
    );

    return unsub;
  }, [roomId]);

  const addSubject = useCallback(
    async (data: {
      subjectName: string;
      kkm?: number;
      semester?: string;
    }) => {
      if (!user) throw new Error("Harus login");
      await addDoc(collection(db, "subjectPJ"), {
        roomId,
        subjectName: data.subjectName,
        kkm: data.kkm || null,
        semester: data.semester || null,
        userId: null,
        displayName: null,
        createdBy: user.id,
        createdAt: serverTimestamp(),
      });
    },
    [roomId, user]
  );

  const updateSubject = useCallback(
    async (
      subjectId: string,
      data: Partial<{ subjectName: string; kkm: number; semester: string }>
    ) => {
      await updateDoc(doc(db, "subjectPJ", subjectId), data);
    },
    []
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

  const upsertPJ = useCallback(
    async (subjectName: string, userId: string | null, displayName: string | null) => {
      const existing = await getSubjectPJByName(subjectName);
      if (existing) {
        await updateDoc(doc(db, "subjectPJ", existing.id), { userId, displayName });
      } else {
        if (!user) throw new Error("Harus login");
        await addDoc(collection(db, "subjectPJ"), {
          roomId,
          subjectName,
          userId,
          displayName,
          kkm: null,
          semester: null,
          createdBy: user.id,
          createdAt: serverTimestamp(),
        });
      }
    },
    [roomId, user, getSubjectPJByName]
  );

  return { subjects, loading, error, addSubject, updateSubject, assignPJ, deleteSubject, upsertPJ, getSubjectPJByName };
}
