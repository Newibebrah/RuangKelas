"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { usePengurus } from "@/hooks/usePengurus";
import { useSubjects } from "@/hooks/useSubjects";
import { useSubjectPJ } from "@/hooks/useSubjectPJ";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SubjectPJSection } from "@/components/pengurus/SubjectPJSection";
import { RoleChangeModal } from "@/components/pengurus/RoleChangeModal";
import { ElectionModal } from "@/components/pengurus/ElectionModal";
import { useLocale } from "@/lib/locale-context";
import { HiUsers, HiLightningBolt } from "react-icons/hi";
import { motion } from "framer-motion";
import { Pengurus } from "@/types";
import toast from "react-hot-toast";

const jabatanColors: Record<string, string> = {
  ketua: "bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-amber-300 shadow-amber-200/50",
  "wakil ketua": "bg-gradient-to-br from-slate-400 to-slate-600 text-white ring-slate-300",
  sekretaris: "bg-gradient-to-br from-sky-400 to-blue-600 text-white ring-sky-300 shadow-blue-200/50",
  bendahara: "bg-gradient-to-br from-emerald-400 to-teal-600 text-white ring-emerald-300 shadow-emerald-200/50",
  anggota: "bg-gradient-to-br from-gray-300 to-gray-500 text-white ring-gray-300",
};

const roleBadgeColors: Record<string, string> = {
  ketua: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700/50",
  "wakil ketua": "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-600/50",
  sekretaris: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-700/50",
  bendahara: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700/50",
  anggota: "bg-surface-muted text-text-secondary ring-border",
};

const roleIcons: Record<string, string> = {
  ketua: "👑",
  "wakil ketua": "⚡",
  sekretaris: "📋",
  bendahara: "💰",
  anggota: "👤",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function PengurusPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();
  const {
    pengurus,
    loading: pengurusLoading,
    error: pengurusError,
    addPengurus,
    updatePengurus,
    deletePengurus,
  } = usePengurus(roomId);
  const { subjects: roomSubjects } = useSubjects(roomId);
  const { subjects, assignPJ } = useSubjectPJ(roomId);

  const [roleModal, setRoleModal] = useState<Pengurus | null>(null);
  const [electionOpen, setElectionOpen] = useState(false);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";
  const isKetua = pengurus.some(
    (p) => p.userId === user?.id && p.jabatan.toLowerCase() === "ketua"
  );
  const canManage = isAdmin || isKetua;

  const memberOptions = useMemo(
    () =>
      members.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
      })),
    [members]
  );

  const pjSubjectNames = useMemo(
    () => subjects.map((s) => s.subjectName),
    [subjects]
  );

  const excludedIds = useMemo(() => {
    const ids = new Set<string>();
    pengurus.forEach((p) => { if (p.userId) ids.add(p.userId); });
    subjects.forEach((s) => { if (s.userId) ids.add(s.userId); });
    return Array.from(ids);
  }, [pengurus, subjects]);

  const loading = pengurusLoading;
  const hasError = pengurusError;

  const sortedPengurus = useMemo(() => {
    const order = ["ketua", "wakil ketua", "sekretaris", "bendahara"];
    return [...pengurus].sort((a, b) => {
      const ai = order.indexOf(a.jabatan.toLowerCase());
      const bi = order.indexOf(b.jabatan.toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [pengurus]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{t('pengurus.title')}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {t('pengurus.structureDesc')}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setElectionOpen(true)}>
            <HiLightningBolt className="h-4 w-4" />
            {t('pengurus.election')}
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : hasError ? (
        <ErrorMessage message={pengurusError || ""} />
      ) : (
        <>
          <section className="mb-10">
            <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {t('pengurus.structure')}
            </h3>
            {sortedPengurus.length === 0 ? (
              <EmptyState
                icon={<HiUsers className="h-16 w-16" />}
                title={t('pengurus.empty')}
                description={
                  canManage
                    ? t('pengurus.emptyManageDesc')
                    : t('pengurus.emptyNotManageDesc')
                }
              />
            ) : (
              <motion.div
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {sortedPengurus.map((p) => {
                  const jLower = p.jabatan.toLowerCase();
                  const colorClass = jabatanColors[jLower] || jabatanColors.anggota;
                  const badgeColor = roleBadgeColors[jLower] || roleBadgeColors.anggota;
                  return (
                    <motion.div key={p.id} variants={cardVariants}>
                      <Card glass hover className="group">
                        <CardBody>
                          <div className="flex flex-col items-center text-center gap-3">
                            <div className="relative">
                              <div
                                className={`h-20 w-20 rounded-full flex items-center justify-center ring-4 shadow-lg ${colorClass}`}
                              >
                                <span className="text-2xl font-bold drop-shadow-sm">
                                  {p.displayName.charAt(0)}
                                </span>
                              </div>
                              <span className="absolute -bottom-1 -right-1 text-lg drop-shadow-lg">
                                {roleIcons[jLower] || "👤"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center justify-center gap-2">
                                <p className="font-semibold text-text-primary truncate">
                                  {p.displayName}
                                </p>
                                {canManage && jLower !== "ketua" && (
                                  <button
                                    onClick={() => setRoleModal(p)}
                                    className="p-1 text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <span
                                className={`inline-block mt-1.5 px-3 py-0.5 text-xs font-semibold rounded-full capitalize ring-1 ${badgeColor}`}
                              >
                                {p.jabatan}
                              </span>
                              <p className="text-xs text-text-muted mt-2">
                                Periode: {p.periode}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </section>

          <section className="mb-8">
            <SubjectPJSection
              roomId={roomId}
              canManage={canManage}
              members={memberOptions}
              subjectsList={roomSubjects.map((s) => s.name)}
            />
          </section>
        </>
      )}

      {roleModal && (
        <RoleChangeModal
          isOpen={!!roleModal}
          onClose={() => setRoleModal(null)}
          pengurus={roleModal}
          onUpdateRole={async (id, jabatan) => {
            await updatePengurus(id, { jabatan });
          }}
          onDelete={async (id) => {
            await deletePengurus(id);
          }}
        />
      )}

      {canManage && (
        <ElectionModal
          isOpen={electionOpen}
          onClose={() => setElectionOpen(false)}
          members={memberOptions}
          excludeIds={excludedIds}
          pjSubjects={pjSubjectNames}
          onConfirmPJ={async (subjectName, winner) => {
            const s = subjects.find((s) => s.subjectName === subjectName);
            if (s) {
              await assignPJ(s.id, winner.userId, winner.displayName);
            }
            toast.success(`${winner.displayName} ditugaskan sebagai PJ ${subjectName}!`);
          }}
          onConfirmPengurus={async (jabatan, winner) => {
            const existing = pengurus.find(
              (p) => p.jabatan.toLowerCase() === jabatan.toLowerCase()
            );
            if (existing) {
              await updatePengurus(existing.id, {
                userId: winner.userId,
                displayName: winner.displayName,
              } as unknown as Partial<Pengurus>);
            } else {
              await addPengurus({
                roomId,
                userId: winner.userId,
                displayName: winner.displayName,
                email: "",
                jabatan,
                periode: new Date().getFullYear().toString(),
              });
            }
            toast.success(
              `${winner.displayName} ditetapkan sebagai ${jabatan}!`
            );
          }}
        />
      )}
    </div>
  );
}
