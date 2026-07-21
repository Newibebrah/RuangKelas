"use client";

import { useState, useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export function useProfile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (data: {
      displayName?: string;
      username?: string;
      bio?: string;
      photoFile?: File;
      onUploadProgress?: (progress: number) => void;
    }) => {
      if (!user) throw new Error("Harus login");
      setLoading(true);
      setError(null);

      try {
        const updateData: Record<string, unknown> = {};
        if (data.displayName !== undefined) updateData.displayName = data.displayName;
        if (data.username !== undefined) updateData.username = data.username || null;
        if (data.bio !== undefined) updateData.bio = data.bio || null;

        if (data.photoFile) {
          const path = `users/${user.id}/profile_${Date.now()}`;
          const storageRef = ref(storage, path);
          const task = uploadBytesResumable(storageRef, data.photoFile);

          await new Promise<void>((resolve, reject) => {
            task.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                data.onUploadProgress?.(progress);
              },
              reject,
              async () => {
                const downloadURL = await getDownloadURL(task.snapshot.ref);
                updateData.photoURL = downloadURL;
                resolve();
              }
            );
          });
        }

        updateData.updatedAt = serverTimestamp();
        await updateDoc(doc(db, "users", user.id), updateData);
        await refreshUser();
      } catch {
        setError("Gagal memperbarui profil");
        throw new Error("Gagal memperbarui profil");
      } finally {
        setLoading(false);
      }
    },
    [user, refreshUser]
  );

  return { loading, error, updateProfile };
}
