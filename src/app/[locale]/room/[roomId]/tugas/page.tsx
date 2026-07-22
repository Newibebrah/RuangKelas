"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAssignments } from "@/hooks/useAssignments";
import { usePengurus } from "@/hooks/usePengurus";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { AssignmentCard } from "@/components/tugas/AssignmentCard";
import { AssignmentModal } from "@/components/tugas/AssignmentModal";
import { Timestamp } from "firebase/firestore";
import { useLocale } from "@/lib/locale-context";
import toast from "react-hot-toast";
import { HiClipboardList, HiPlus } from "react-icons/hi";
import { Assignment } from "@/types";

export default function TugasPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { assignments, loading, error, createAssignment, updateAssignment, deleteAssignment } =
    useAssignments(roomId);
  const { members } = useRoom();
  const { pengurus } = usePengurus(roomId);
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";
  const isSekretaris = pengurus.some(
    (p) => p.userId === user?.id && p.jabatan.toLowerCase() === "sekretaris"
  );
  const canManage = isAdmin || isSekretaris;

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

  return (
    <div className="pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shadow-sm">
            <HiClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{t('nav.tugas')}</h1>
            <p className="text-sm text-text-secondary">
              {assignments.length} tugas{" "}
              {assignments.length > 0 && (
                <span className="text-text-muted">
                  — {assignments.filter((a) => a.deadline.toDate() < new Date()).length} terlewat
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : assignments.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<HiClipboardList className="h-8 w-8" />}
            title={t('tugas.empty')}
            description={
              canManage
                ? t('tugas.emptyManageDesc')
                : t('tugas.emptyNotManageDesc')
            }
          />
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
          className="space-y-0"
        >
          {assignments.map((tugas, i) => (
            <div key={tugas.id} className="relative">
              <AssignmentCard
                assignment={tugas}
                canManage={canManage}
                isDeleting={deletingId === tugas.id}
                roomId={roomId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                index={i}
              />
            </div>
          ))}
        </motion.div>
      )}

      {canManage && (
        <>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreate}
            className="md:hidden fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <HiPlus className="h-6 w-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            className="hidden md:inline-flex fixed bottom-8 right-8 z-40 items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-sm"
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
        onSubmit={handleSubmit}
      />
    </div>
  );
}
