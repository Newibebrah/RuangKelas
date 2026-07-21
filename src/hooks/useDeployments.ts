"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Deployment } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { notifyAllMembers } from "@/lib/notifications";
import { uploadFile, generateFilePath } from "@/lib/upload";

export function useDeployments(roomId: string) {
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "deployments"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Deployment
        );
        setDeployments(data);
        setLoading(false);
      },
      async () => {
        // Fallback: if composite index missing, try without orderBy
        try {
          const q2 = query(
            collection(db, "deployments"),
            where("roomId", "==", roomId)
          );
          const snap = await getDocs(q2);
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Deployment)
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
          setDeployments(data);
          setLoading(false);
        } catch {
          setError(
            "Gagal memuat materi. Buat composite index di Firebase Console: " +
            "Firestore > Indexes > Add index: deployments, roomId ASC, createdAt DESC"
          );
          setLoading(false);
        }
      }
    );

    return unsub;
  }, [roomId]);

  const createDeployment = useCallback(
    async (data: {
      title: string;
      description?: string;
      files: File[];
      onProgress?: (progress: number) => void;
    }) => {
      if (!user) throw new Error("Harus login");

      const attachmentUrls: string[] = [];
      const attachmentPaths: string[] = [];

      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        const path = generateFilePath(roomId, "deploy", file.name);
        const url = await uploadFile(file, path, (progress) => {
          const overall =
            ((i + progress.progress / 100) / data.files.length) * 100;
          data.onProgress?.(Math.round(overall));
        });
        attachmentUrls.push(url);
        attachmentPaths.push(path);
      }

      const docRef = await addDoc(collection(db, "deployments"), {
        roomId,
        title: data.title.trim(),
        description: data.description?.trim() || "",
        attachments: attachmentUrls,
        attachmentPaths,
        createdBy: user.id,
        displayName: user.displayName,
        createdAt: serverTimestamp(),
      });

      await notifyAllMembers(roomId, {
        type: "materi",
        title: "Materi Baru",
        message: `"${data.title.trim()}" telah dibagikan`,
        roomId,
        link: `/room/${roomId}`,
      });

      return docRef.id;
    },
    [roomId, user]
  );

  const deleteDeployment = useCallback(
    async (deployment: Deployment) => {
      const paths = deployment.attachmentPaths || [];
      for (const p of paths) {
        try {
          const storageRef = ref(storage, p);
          await deleteObject(storageRef);
        } catch {
          // ignore if file already deleted
        }
      }
      await deleteDoc(doc(db, "deployments", deployment.id));
    },
    []
  );

  return {
    deployments,
    loading,
    error,
    createDeployment,
    deleteDeployment,
  };
}
