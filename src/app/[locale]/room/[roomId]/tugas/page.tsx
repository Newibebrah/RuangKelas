"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{t('nav.tugas')}</h2>
          <p className="text-sm text-text-secondary mt-1">
            {t('tugas.desc')}
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <HiPlus className="h-4 w-4" />
            {t('tugas.newTask')}
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<HiClipboardList className="h-8 w-8" />}
          title={t('tugas.empty')}
          description={
            canManage
              ? t('tugas.emptyManageDesc')
              : t('tugas.emptyNotManageDesc')
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((tugas) => (
            <AssignmentCard
              key={tugas.id}
              assignment={tugas}
              canManage={canManage}
              isDeleting={deletingId === tugas.id}
              roomId={roomId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {canManage && (
        <button
          onClick={handleCreate}
          className="md:hidden fixed bottom-6 right-6 z-40 p-4 bg-primary-600 text-white rounded-full shadow-fab hover:bg-primary-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-95"
        >
          <HiPlus className="h-6 w-6" />
        </button>
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
