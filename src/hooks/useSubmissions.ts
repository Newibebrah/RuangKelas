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
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cloudinaryUpload } from "@/lib/cloudinary";
import { Submission } from "@/types";

export function useSubmissions(assignmentId: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;

    const q = query(
      collection(db, "tugas", assignmentId, "submissions"),
      orderBy("submittedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Submission
      );
      setSubmissions(data);
      setLoading(false);
    });

    return unsub;
  }, [assignmentId]);

  const submitWork = useCallback(
    async (data: {
      userId: string;
      displayName: string;
      roomId: string;
      file: File;
      notes?: string;
      onProgress?: (progress: number) => void;
    }) => {
      const result = await cloudinaryUpload(data.file, {
        folder: `tugas/${data.roomId}/submissions`,
        onProgress: data.onProgress,
      });

      const docRef = await addDoc(
        collection(db, "tugas", assignmentId, "submissions"),
        {
          assignmentId,
          roomId: data.roomId,
          userId: data.userId,
          displayName: data.displayName,
          fileUrl: result.secure_url,
          filePublicId: result.public_id,
          notes: data.notes || null,
          submittedAt: serverTimestamp(),
        }
      );

      return docRef.id;
    },
    [assignmentId]
  );

  const updateSubmission = useCallback(
    async (
      submissionId: string,
      data: {
        grade?: number;
        comment?: string;
        gradedBy?: string;
      }
    ) => {
      await updateDoc(
        doc(db, "tugas", assignmentId, "submissions", submissionId),
        {
          ...data,
          gradedAt: serverTimestamp(),
        }
      );
    },
    [assignmentId]
  );

  return { submissions, loading, submitWork, updateSubmission };
}
