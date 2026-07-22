"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { useDeployments } from "@/hooks/useDeployments";
import { useRoomSubjects } from "@/hooks/useRoomSubjects";
import { MaterialList } from "@/components/class/MaterialList";
import { DeployModal } from "@/components/class/actions/deploy";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useLocale } from "@/lib/locale-context";
import { HiPlus } from "react-icons/hi";

export default function MateriPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();
  const { subjects: roomSubjects } = useRoomSubjects(roomId);
  const {
    deployments,
    loading,
    error,
    deleteDeployment,
  } = useDeployments(roomId);

  const [deployOpen, setDeployOpen] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const canManage = currentMember?.role === "admin" || currentMember?.role === "guru";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{t('nav.materi')}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {t('materi.desc')}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setDeployOpen(true)}>
            <HiPlus className="h-4 w-4" />
            {t('materi.share')}
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" message={t('common.loadingMateri')} />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <MaterialList
          deployments={deployments}
          canManage={canManage}
          onDelete={deleteDeployment}
        />
      )}

      <DeployModal
        isOpen={deployOpen}
        onClose={() => setDeployOpen(false)}
        roomId={roomId}
        subjects={roomSubjects.map((s) => s.name)}
      />
    </div>
  );
}
