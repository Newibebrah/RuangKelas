"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  collectionGroup,
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
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cloudinaryUpload } from "@/lib/cloudinary";
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
          (d) => ({ id: d.id, ...d.data() }) as Assignment
        );
        setAssignments(data);
        setLoading(false);
      },
      async () => {
        try {
          const q2 = query(
            collection(db, "tugas"),
            where("roomId", "==", roomId)
          );
          const snap = await getDocs(q2);
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Assignment)
            .sort((a, b) => {
              const aTime = a.deadline?.toMillis?.() || 0;
              const bTime = b.deadline?.toMillis?.() || 0;
              return aTime - bTime;
            });
          setAssignments(data);
          setLoading(false);
        } catch {
          setError(
            "Gagal memuat tugas. Buat composite index di Firebase Console: " +
            "Firestore > Indexes > Add index: tugas, roomId ASC, deadline ASC"
          );
          setLoading(false);
        }
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
      files?: File[];
      onProgress?: (progress: number) => void;
      createdBy: string;
    }) => {
      const attachments: string[] = [];
      const attachmentPublicIds: string[] = [];

      if (data.files?.length) {
        const total = data.files.length;
        for (let i = 0; i < total; i++) {
          const file = data.files[i];
          const result = await cloudinaryUpload(file, {
            folder: `tugas/${roomId}`,
            onProgress: data.onProgress
              ? (p) => {
                  const overall =
                    ((i + p / 100) / total) * 100;
                  data.onProgress!(Math.round(overall));
                }
              : undefined,
          });
          attachments.push(result.secure_url);
          attachmentPublicIds.push(result.public_id);
        }
      }

      const docRef = await addDoc(collection(db, "tugas"), {
        roomId,
        subject: data.subject,
        description: data.description,
        deadline: data.deadline,
        teacherNote: data.teacherNote || null,
        attachments: attachments.length ? attachments : null,
        attachmentPublicIds: attachmentPublicIds.length ? attachmentPublicIds : null,
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
      });

      await notifyAllMembers(roomId, {
        type: "assignment",
        title: "Tugas Baru",
        message: `Tugas ${data.subject} telah ditambahkan`,
        roomId,
        link: `/room/${roomId}/tugas/${docRef.id}`,
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
        files?: File[];
        onProgress?: (progress: number) => void;
      }
    ) => {
      const updateData: Record<string, unknown> = {};
      if (data.subject !== undefined) updateData.subject = data.subject;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.deadline !== undefined) updateData.deadline = data.deadline;
      if (data.teacherNote !== undefined) updateData.teacherNote = data.teacherNote || null;

      if (data.files?.length) {
        const attachments: string[] = [];
        const attachmentPublicIds: string[] = [];
        const total = data.files.length;
        for (let i = 0; i < total; i++) {
          const file = data.files[i];
          const result = await cloudinaryUpload(file, {
            folder: `tugas/${roomId}`,
            onProgress: data.onProgress
              ? (p) => {
                  const overall =
                    ((i + p / 100) / total) * 100;
                  data.onProgress!(Math.round(overall));
                }
              : undefined,
          });
          attachments.push(result.secure_url);
          attachmentPublicIds.push(result.public_id);
        }
        updateData.attachments = attachments;
        updateData.attachmentPublicIds = attachmentPublicIds;
      }

      await updateDoc(doc(db, "tugas", tugasId), updateData);
    },
    [roomId]
  );

  const deleteAssignment = useCallback(async (tugasId: string) => {
    const snap = await getDocs(
      query(collectionGroup(db, "submissions"), where("assignmentId", "==", tugasId))
    );
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
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
