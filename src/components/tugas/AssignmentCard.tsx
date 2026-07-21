"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, isAfter, differenceInHours } from "date-fns";
import { id } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { HiPencil, HiTrash, HiPaperClip } from "react-icons/hi";
import { Assignment } from "@/types";

interface AssignmentCardProps {
  assignment: Assignment;
  canManage: boolean;
  isDeleting: boolean;
  roomId: string;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}

function isNew(createdAt?: Timestamp) {
  if (!createdAt) return false;
  try {
    return differenceInHours(new Date(), createdAt.toDate()) < 24;
  } catch {
    return false;
  }
}

function isPastDeadline(deadline: Timestamp) {
  try {
    return !isAfter(deadline.toDate(), new Date());
  } catch {
    return false;
  }
}

export const AssignmentCard = memo(function AssignmentCard({
  assignment,
  canManage,
  isDeleting,
  roomId,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const router = useRouter();
  const past = isPastDeadline(assignment.deadline);

  return (
    <Card
      hover
      className="cursor-pointer"
      onClick={() => router.push(`/room/${roomId}/tugas/${assignment.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {assignment.subject ?? "Tanpa judul"}
            </h3>
            {isNew(assignment.createdAt) && !past && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full">
                Baru
              </span>
            )}
          </div>
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(assignment);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Edit tugas"
              >
                <HiPencil className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(assignment);
                }}
                disabled={isDeleting}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Hapus tugas"
              >
                <HiTrash className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-sm text-gray-500 mb-3 line-clamp-3">
          {assignment.description ?? "Tidak ada deskripsi"}
        </p>
        <div className="space-y-1.5">
          {assignment.attachments?.length ? (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <HiPaperClip className="h-3 w-3" />
              {assignment.attachments.length} lampiran
            </div>
          ) : null}
          {assignment.deadline && (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`font-medium ${
                  past ? "text-red-600" : "text-gray-700"
                }`}
              >
                {past ? "Terlewat" : "Deadline"}
              </span>
              <span className={past ? "text-red-500" : "text-gray-400"}>
                {formatDistanceToNow(assignment.deadline.toDate(), {
                  addSuffix: true,
                  locale: id,
                })}
              </span>
            </div>
          )}
          {assignment.teacherNote && (
            <div className="text-xs text-gray-400 italic">
              Catatan: {assignment.teacherNote}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
});
