"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { MemberList } from "@/components/room/MemberList";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export default function AnggotaPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members, loading, error } = useRoom();

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";

  if (loading) return <LoadingSpinner size="lg" message="Memuat anggota..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Anggota Kelas</h2>
        <p className="text-sm text-text-secondary mt-1">
          {members.length} anggota terdaftar
        </p>
      </div>

      <MemberList
        roomId={roomId}
        members={members}
        currentUserId={user?.id || ""}
        isAdmin={isAdmin}
      />
    </div>
  );
}
