"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { MemberList } from "@/components/room/MemberList";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useLocale } from "@/lib/locale-context";
import { HiUserGroup } from "react-icons/hi";

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
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20">
          <HiUserGroup className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">{t('nav.anggota')}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {members.length} {t('common.memberCount')}
          </p>
        </div>
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
