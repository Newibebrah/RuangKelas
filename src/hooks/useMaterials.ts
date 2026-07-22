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
import { db } from "@/lib/firebase";
import { Material } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { notifyAllMembers } from "@/lib/notifications";
import { cloudinaryUpload } from "@/lib/cloudinary";

export function useMaterials(roomId: string) {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "materials"),
      where("roomId", "==", roomId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Material
        );
        setMaterials(data);
        setLoading(false);
      },
      async () => {
        try {
          const q2 = query(
            collection(db, "materials"),
            where("roomId", "==", roomId)
          );
          const snap = await getDocs(q2);
          const data = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Material)
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() || 0;
              const bTime = b.createdAt?.toMillis?.() || 0;
              return bTime - aTime;
            });
          setMaterials(data);
          setLoading(false);
        } catch {
          setError("Gagal memuat materi");
          setLoading(false);
        }
      }
    );

    return unsub;
  }, [roomId]);

  const createMaterial = useCallback(
    async (data: {
      title: string;
      description?: string;
      subject: string;
      files: File[];
      onProgress?: (progress: number) => void;
    }) => {
      if (!user) throw new Error("Harus login");

      const attachmentUrls: string[] = [];
      const attachmentPublicIds: string[] = [];

      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        const result = await cloudinaryUpload(file, {
          folder: `materials/${roomId}`,
          onProgress: (progress) => {
            const overall =
              ((i + progress / 100) / data.files.length) * 100;
            data.onProgress?.(Math.round(overall));
          },
        });
        attachmentUrls.push(result.secure_url);
        attachmentPublicIds.push(result.public_id);
      }

      const docRef = await addDoc(collection(db, "materials"), {
        roomId,
        title: data.title.trim(),
        description: data.description?.trim() || "",
        subject: data.subject,
        attachments: attachmentUrls,
        attachmentPublicIds,
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

  const deleteMaterial = useCallback(async (material: Material) => {
    const publicIds = material.attachmentPublicIds || [];
    for (const publicId of publicIds) {
      try {
        await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });
      } catch {
        // ignore
      }
    }
    await deleteDoc(doc(db, "materials", material.id));
  }, []);

  return {
    materials,
    loading,
    error,
    createMaterial,
    deleteMaterial,
  };
}
