"use client";

import { useState, useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cloudinaryUpload } from "@/lib/cloudinary";
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
          const result = await cloudinaryUpload(data.photoFile, {
            folder: "profiles",
            onProgress: data.onUploadProgress,
          });
          updateData.photoURL = result.secure_url;
        }

        updateData.updatedAt = serverTimestamp();
        await updateDoc(doc(db, "users", user.id), updateData);
        await refreshUser();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memperbarui profil";
        console.error("updateProfile error:", err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, refreshUser]
  );

  return { loading, error, updateProfile };
}
