"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { MemberList } from "@/components/room/MemberList";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useLocale } from "@/lib/locale-context";

export default function AnggotaPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members, loading, error } = useRoom();

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";

  if (loading) return <LoadingSpinner size="lg" message={t('common.loadingAnggota')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">{t('nav.anggota')}</h2>
        <p className="text-sm text-text-secondary mt-1">
          {members.length} {t('common.memberCount')}
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
