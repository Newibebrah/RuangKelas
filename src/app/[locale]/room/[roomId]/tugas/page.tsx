"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAssignments } from "@/hooks/useAssignments";
import { usePengurus } from "@/hooks/usePengurus";
import { useSubjects } from "@/hooks/useSubjects";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { AssignmentCard } from "@/components/tugas/AssignmentCard";
import { AssignmentModal } from "@/components/tugas/AssignmentModal";
import { Card, CardBody } from "@/components/ui/Card";
import { Timestamp } from "firebase/firestore";
import { useLocale } from "@/lib/locale-context";
import toast from "react-hot-toast";
import { HiClipboardList, HiPlus, HiArrowLeft, HiAcademicCap } from "react-icons/hi";
import { Assignment } from "@/types";

const SUBJECT_COLORS = [
  "from-pink-100 to-rose-200 dark:from-pink-900/30 dark:to-rose-900/30",
  "from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-900/30",
  "from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-900/30",
  "from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/30",
  "from-violet-100 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30",
  "from-lime-100 to-green-200 dark:from-lime-900/30 dark:to-green-900/30",
  "from-cyan-100 to-indigo-200 dark:from-cyan-900/30 dark:to-indigo-900/30",
  "from-fuchsia-100 to-pink-200 dark:from-fuchsia-900/30 dark:to-pink-900/30",
];

const SUBJECT_EMOJIS: Record<string, string> = {
  matematika: "📐",
  "bahasa indonesia": "📖",
  "bahasa inggris": "🌍",
  ipa: "🔬",
  ips: "🌏",
  ppkn: "⚖️",
  agama: "🕌",
  "seni budaya": "🎨",
  penjaskes: "⚽",
  prakarya: "🛠️",
  informatika: "💻",
};

function getSubjectColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

function getSubjectEmoji(name: string) {
  const key = name.toLowerCase();
  return SUBJECT_EMOJIS[key] || "📚";
}

export default function TugasPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { assignments, loading, error, createAssignment, updateAssignment, deleteAssignment } =
    useAssignments(roomId);
  const { members } = useRoom();
  const { pengurus } = usePengurus(roomId);
  const { subjects: roomSubjects } = useSubjects(roomId);
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";
  const isSekretaris = pengurus.some(
    (p) => p.userId === user?.id && p.jabatan.toLowerCase() === "sekretaris"
  );
  const canManage = isAdmin || isSekretaris;

  const filteredAssignments = useMemo(() => {
    if (!selectedSubject) return [];
    return assignments.filter((a) => a.subject === selectedSubject);
  }, [assignments, selectedSubject]);

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assignments.forEach((a) => {
      const key = a.subject || "Lainnya";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [assignments]);

  const subjectsWithData = useMemo(() => {
    const allSubjects = roomSubjects.map((s) => ({
      name: s.name,
      count: subjectCounts[s.name] || 0,
    }));
    const hasOther = assignments.some((a) => a.subject && !roomSubjects.find((s) => s.name === a.subject));
    if (hasOther) {
      allSubjects.push({ name: "Lainnya", count: subjectCounts["Lainnya"] || 0 });
    }
    return allSubjects;
  }, [roomSubjects, subjectCounts, assignments]);

  const handleCreate = () => {
    setEditingAssignment(null);
    setModalOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setModalOpen(true);
  };

  const handleDelete = async (assignment: Assignment) => {
    if (!window.confirm(`Hapus tugas "${assignment.subject}"?`)) return;
    setDeletingId(assignment.id);
    try {
      await deleteAssignment(assignment.id);
      toast.success("Tugas berhasil dihapus!");
    } catch {
      toast.error("Gagal menghapus tugas");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (data: {
    subject: string;
    description: string;
    deadline: Timestamp;
    teacherNote?: string;
    files?: File[];
  }) => {
    if (editingAssignment) {
      await updateAssignment(editingAssignment.id, data);
    } else {
      await createAssignment({
        subject: data.subject,
        description: data.description,
        deadline: data.deadline,
        teacherNote: data.teacherNote,
        files: data.files,
        createdBy: user!.id,
      });
    }
  };

  if (loading) {
    return (
      <div className="pb-20">
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="pb-20">
      {selectedSubject ? (
        <>
          <div className="mb-6">
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => setSelectedSubject(null)}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-3"
            >
              <HiArrowLeft className="h-4 w-4" />
              Kembali ke daftar matkul
            </motion.button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getSubjectEmoji(selectedSubject)}</span>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary font-heading">{selectedSubject}</h1>
                  <p className="text-sm text-text-secondary">
                    {filteredAssignments.length} tugas
                  </p>
                </div>
              </div>
              {canManage && (
                <Button size="sm" onClick={handleCreate}>
                  <HiPlus className="h-4 w-4" />
                  Tambah Tugas
                </Button>
              )}
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <EmptyState
              icon={<HiClipboardList className="h-8 w-8" />}
              title="Belum ada tugas"
              description={canManage ? "Buat tugas baru untuk matkul ini" : "Belum ada tugas untuk matkul ini"}
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              className="space-y-3"
            >
              {filteredAssignments.map((tugas) => (
                <motion.div key={tugas.id} layout className="relative">
                  <AssignmentCard
                    assignment={tugas}
                    canManage={canManage}
                    isDeleting={deletingId === tugas.id}
                    roomId={roomId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    index={assignments.indexOf(tugas)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20">
                <HiClipboardList className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary font-heading">{t('nav.tugas')}</h1>
                <p className="text-sm text-text-secondary">
                  {assignments.length} tugas, {roomSubjects.length} matkul
                </p>
              </div>
            </div>
          </div>

          {subjectsWithData.length === 0 ? (
            <EmptyState
              icon={<HiClipboardList className="h-8 w-8" />}
              title={t('tugas.empty')}
              description={
                roomSubjects.length === 0
                  ? "Belum ada jadwal matkul. Atur di halaman Jadwal"
                  : canManage
                    ? t('tugas.emptyManageDesc')
                    : t('tugas.emptyNotManageDesc')
              }
            />
          ) : (
            <motion.div
              className="grid gap-4 grid-cols-2 lg:grid-cols-3"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
              initial="hidden"
              animate="visible"
            >
              {subjectsWithData.map((subject) => (
                <motion.button
                  key={subject.name}
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
                  }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSubject(subject.name)}
                  className="text-left"
                >
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className={`bg-gradient-to-br ${getSubjectColor(subject.name)} px-5 pt-5 pb-4`}>
                      <span className="text-3xl" role="img" aria-label={subject.name}>
                        {getSubjectEmoji(subject.name)}
                      </span>
                      <h4 className="font-bold text-text-primary mt-3 text-sm leading-tight font-heading">
                        {subject.name}
                      </h4>
                    </div>
                    <CardBody className="!px-5 !py-3">
                      <div className="flex items-center gap-2">
                        <HiAcademicCap className="h-4 w-4 text-text-muted" />
                        <span className="text-sm text-text-secondary font-medium">
                          {subject.count} tugas
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.button>
              ))}
            </motion.div>
          )}
        </>
      )}

      {canManage && !selectedSubject && (
        <>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="md:hidden fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-primary-600 to-purple-600 text-white rounded-full shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <HiPlus className="h-6 w-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            className="hidden md:inline-flex fixed bottom-8 right-8 z-40 items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/35 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 font-semibold text-sm"
          >
            <HiPlus className="h-5 w-5" />
            {t('tugas.newTask')}
          </motion.button>
        </>
      )}

      <AssignmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingAssignment(null);
        }}
        assignment={editingAssignment}
        subjects={roomSubjects.map((s) => s.name)}
        initialSubject={selectedSubject || undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
