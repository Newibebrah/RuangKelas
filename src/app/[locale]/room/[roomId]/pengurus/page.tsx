"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { usePengurus } from "@/hooks/usePengurus";
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
import { HiUsers, HiPencil, HiLightningBolt } from "react-icons/hi";
import { Pengurus } from "@/types";
import toast from "react-hot-toast";

  const jabatanColors: Record<string, string> = {
    ketua: "bg-red-50 text-red-700 ring-red-200",
    "wakil ketua": "bg-orange-50 text-orange-700 ring-orange-200",
    sekretaris: "bg-blue-50 text-blue-700 ring-blue-200",
    bendahara: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    anggota: "bg-gray-50 text-gray-700 ring-gray-200",
  };

export default function PengurusPage() {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Pengurus</h2>
          <p className="text-sm text-text-secondary mt-1">
            Struktur organisasi kelas
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setElectionOpen(true)}>
            <HiLightningBolt className="h-4 w-4" />
            Roda Pemilihan
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : hasError ? (
        <ErrorMessage message={pengurusError || ""} />
      ) : (
        <>
          <section className="mb-8">
            <h3 className="text-base font-semibold text-text-primary mb-3">
              Struktur Pengurus
            </h3>
            {sortedPengurus.length === 0 ? (
              <EmptyState
                icon={<HiUsers className="h-16 w-16" />}
                title="Belum ada pengurus"
                description={
                  canManage
                    ? "Gunakan roda pemilihan untuk memilih pengurus"
                    : "Ketua belum mengisi struktur pengurus"
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedPengurus.map((p) => {
                  const jLower = p.jabatan.toLowerCase();
                  const colorClass =
                    jabatanColors[jLower] || "bg-gray-100 text-gray-700 ring-gray-200";
                  return (
                    <Card key={p.id} hover>
                      <CardBody>
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-14 w-14 rounded-full flex items-center justify-center ring-2 ${colorClass}`}
                          >
                            <span className="text-xl font-bold">
                              {p.displayName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">
                                {p.displayName}
                              </p>
                              {canManage && jLower !== "ketua" && (
                                <button
                                  onClick={() => setRoleModal(p)}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors shrink-0"
                                >
                                  <HiPencil className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                                jabatanColors[jLower] ||
                                "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {p.jabatan}
                            </span>
                            <p className="text-xs text-gray-400 mt-1">
                              Periode: {p.periode}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mb-8">
            <SubjectPJSection
              roomId={roomId}
              canManage={canManage}
              members={memberOptions}
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
