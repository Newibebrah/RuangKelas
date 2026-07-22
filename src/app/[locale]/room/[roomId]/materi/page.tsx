"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { useDeployments } from "@/hooks/useDeployments";
import { useSubjects } from "@/hooks/useSubjects";
import { useMaterials } from "@/hooks/useMaterials";
import { MaterialList } from "@/components/class/MaterialList";
import { MaterialsSection } from "@/components/class/MaterialsSection";
import { DeployModal } from "@/components/class/actions/deploy";
import { MaterialModal } from "@/components/class/MaterialModal";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useLocale } from "@/lib/locale-context";
import { HiPlus, HiBookOpen } from "react-icons/hi";

export default function MateriPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();
  const { subjects } = useSubjects(roomId);
  const {
    deployments,
    loading: deplLoading,
    error: deplError,
    deleteDeployment,
  } = useDeployments(roomId);
  const {
    materials,
    loading: matLoading,
    error: matError,
    createMaterial,
    deleteMaterial,
  } = useMaterials(roomId);

  const [deployOpen, setDeployOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const canDeploy = currentMember?.role === "admin" || currentMember?.role === "guru";
  const canManageMaterial = currentMember?.role === "admin" || currentMember?.role === "guru" || currentMember?.role === "pengurus";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{t('nav.materi')}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {t('materi.desc')}
          </p>
        </div>
        <div className="flex gap-2">
          {canManageMaterial && (
            <Button variant="secondary" onClick={() => setMaterialOpen(true)}>
              <HiBookOpen className="h-4 w-4" />
              Materi Baru
            </Button>
          )}
          {canDeploy && (
            <Button onClick={() => setDeployOpen(true)}>
              <HiPlus className="h-4 w-4" />
              {t('materi.share')}
            </Button>
          )}
        </div>
      </div>

      {materials.length > 0 && (
        <section className="mb-10">
          <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Materi Pelajaran
          </h3>
          {matLoading ? (
            <LoadingSpinner size="md" />
          ) : matError ? (
            <ErrorMessage message={matError} />
          ) : (
            <MaterialsSection
              materials={materials}
              canManage={canManageMaterial}
              onDelete={deleteMaterial}
            />
          )}
        </section>
      )}

      <section>
        <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Pengumuman &amp; Materi Umum
        </h3>
        {deplLoading ? (
          <LoadingSpinner size="lg" message={t('common.loadingMateri')} />
        ) : deplError ? (
          <ErrorMessage message={deplError} />
        ) : (
          <MaterialList
            deployments={deployments}
            canManage={canDeploy}
            onDelete={deleteDeployment}
          />
        )}
      </section>

      <DeployModal
        isOpen={deployOpen}
        onClose={() => setDeployOpen(false)}
        roomId={roomId}
        subjects={subjects.map((s) => s.name)}
      />

      <MaterialModal
        isOpen={materialOpen}
        onClose={() => setMaterialOpen(false)}
        roomId={roomId}
        subjects={subjects.map((s) => s.name)}
        onSubmit={async (data) => {
          await createMaterial(data);
        }}
      />
    </div>
  );
}
