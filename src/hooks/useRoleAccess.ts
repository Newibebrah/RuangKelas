"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { usePengurus } from "@/hooks/usePengurus";

export type KasRole = "bendahara" | "ketua" | "sekretaris" | "anggota";

export function useRoleAccess(roomId: string) {
  const { user } = useAuth();
  const { members } = useRoom();
  const { pengurus } = usePengurus(roomId);

  const currentMember = useMemo(
    () => members.find((m) => m.userId === user?.id),
    [members, user?.id]
  );

  const isAdmin = currentMember?.role === "admin";

  const jabatanLower = useMemo(() => {
    const p = pengurus.find((p) => p.userId === user?.id);
    return p?.jabatan.toLowerCase() ?? "";
  }, [pengurus, user?.id]);

  const isBendahara = jabatanLower === "bendahara";
  const isKetua = jabatanLower === "ketua";
  const isSekretaris = jabatanLower === "sekretaris";

  const kasRole: KasRole = isAdmin || isBendahara
    ? "bendahara"
    : isKetua
      ? "ketua"
      : isSekretaris
        ? "sekretaris"
        : "anggota";

  const canManageKas = isAdmin || isBendahara;
  const canViewKasManagement = isAdmin || isBendahara || isKetua || isSekretaris;
  const canDownloadReport = isAdmin || isBendahara || isKetua || isSekretaris;

  return {
    isAdmin,
    isBendahara,
    isKetua,
    isSekretaris,
    kasRole,
    canManageKas,
    canViewKasManagement,
    canDownloadReport,
  };
}