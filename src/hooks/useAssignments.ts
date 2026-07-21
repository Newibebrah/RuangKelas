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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Assignment } from "@/types";
import { notifyAllMembers } from "@/lib/notifications";

export function useAssignments(roomId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "tugas"),
      where("roomId", "==", roomId),
      orderBy("deadline", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Assignment)
        );
        setAssignments(data);
        setLoading(false);
      },
      () => {
        setError("Gagal memuat tugas");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [roomId]);

  const createAssignment = useCallback(
    async (data: {
      subject: string;
      description: string;
      deadline: Timestamp;
      teacherNote?: string;
      createdBy: string;
    }) => {
      const docRef = await addDoc(collection(db, "tugas"), {
        roomId,
        ...data,
        createdAt: serverTimestamp(),
      });
      await notifyAllMembers(roomId, {
        type: "assignment",
        title: "Tugas Baru",
        message: `Tugas ${data.subject} telah ditambahkan`,
        roomId,
        link: `/room/${roomId}/tugas`,
      });
      return docRef.id;
    },
    [roomId]
  );

  const updateAssignment = useCallback(
    async (
      tugasId: string,
      data: {
        subject?: string;
        description?: string;
        deadline?: Timestamp;
        teacherNote?: string;
      }
    ) => {
      await updateDoc(doc(db, "tugas", tugasId), data);
    },
    []
  );

  const deleteAssignment = useCallback(async (tugasId: string) => {
    await deleteDoc(doc(db, "tugas", tugasId));
  }, []);

  return {
    assignments,
    loading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
