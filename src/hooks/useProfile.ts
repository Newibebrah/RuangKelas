"use client";

import { useState, useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export function useProfile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      if (!user) throw new Error("Harus login");
      setLoading(true);
      setError(null);
      try {
        await updateDoc(doc(db, "users", user.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
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

  return {
    loading,
    error,
    updateProfile,
  };
}
