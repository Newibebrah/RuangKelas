"use client";

import { memo, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { format, formatDistanceToNow, isAfter, differenceInHours } from "date-fns";
import { id } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { HiPencil, HiTrash, HiPaperClip, HiClock } from "react-icons/hi";
import { Assignment } from "@/types";

interface AssignmentCardProps {
  assignment: Assignment;
  canManage: boolean;
  isDeleting: boolean;
  roomId: string;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  index?: number;
}

function isNew(createdAt?: Timestamp) {
  if (!createdAt) return false;
  try {
    return differenceInHours(new Date(), createdAt.toDate()) < 24;
  } catch {
    return false;
  }
}

function getUrgency(deadline: Timestamp): "overdue" | "soon" | "upcoming" {
  try {
    const now = new Date();
    const d = deadline.toDate();
    if (!isAfter(d, now)) return "overdue";
    const hours = differenceInHours(d, now);
    if (hours <= 24) return "soon";
    return "upcoming";
  } catch {
    return "upcoming";
  }
}

const urgencyConfig = {
  overdue: {
    dot: "bg-red-500",
    line: "border-red-500",
    ring: "ring-red-500/30",
    label: "Terlewat",
    labelClass: "text-red-600 dark:text-red-400",
  },
  soon: {
    dot: "bg-amber-500",
    line: "border-amber-500",
    ring: "ring-amber-500/30",
    label: "Deadline",
    labelClass: "text-amber-600 dark:text-amber-400",
  },
  upcoming: {
    dot: "bg-blue-500",
    line: "border-blue-500",
    ring: "ring-blue-500/30",
    label: "Deadline",
    labelClass: "text-blue-600 dark:text-blue-400",
  },
};

export const AssignmentCard = memo(function AssignmentCard({
  assignment,
  canManage,
  isDeleting,
  roomId,
  onEdit,
  onDelete,
  index = 0,
}: AssignmentCardProps) {
  const router = useRouter();
  const urgency = useMemo(() => getUrgency(assignment.deadline), [assignment.deadline]);
  const config = urgencyConfig[urgency];
  const past = urgency === "overdue";
  const newBadge = isNew(assignment.createdAt) && !past;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      className="relative pl-10 group"
    >
      <div className="absolute left-[15px] top-3 bottom-0 w-[2px] bg-gradient-to-b from-border via-border to-transparent group-last:bg-gradient-to-b group-last:from-border group-last:to-transparent" />
      <div
        className={`absolute left-[7px] top-[18px] w-[18px] h-[18px] rounded-full ${config.dot} ring-4 ${config.ring} border-2 border-white dark:border-slate-900 z-10 shadow-sm`}
      />
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={() => router.push(`/room/${roomId}/tugas/${assignment.id}`)}
        className={`relative cursor-pointer bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-lg border-l-4 ${config.line} border border-border dark:border-slate-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h3 className="font-semibold text-text-primary truncate text-base">
                {assignment.subject ?? "Tanpa judul"}
              </h3>
              {newBadge && (
                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 dark:bg-primary-900/50 dark:text-primary-300 rounded-full">
                  Baru
                </span>
              )}
            </div>
            {canManage && (
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(assignment);
                  }}
                  className="p-1.5 text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
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
                  className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Hapus tugas"
                >
                  <HiTrash className={`h-4 w-4 ${isDeleting ? "animate-spin" : ""}`} />
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-2 line-clamp-2 leading-relaxed">
            {assignment.description ?? "Tidak ada deskripsi"}
          </p>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {assignment.deadline && (
              <div className="flex items-center gap-1.5 text-xs">
                <HiClock className={`h-3.5 w-3.5 ${config.labelClass}`} />
                <span className={config.labelClass}>
                  {config.label}
                </span>
                <span className={past ? "text-red-600 dark:text-red-400 font-medium" : "text-text-muted"}>
                  {formatDistanceToNow(assignment.deadline.toDate(), {
                    addSuffix: true,
                    locale: id,
                  })}
                </span>
              </div>
            )}
            {assignment.attachments?.length ? (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <HiPaperClip className="h-3.5 w-3.5" />
                {assignment.attachments.length} lampiran
              </div>
            ) : null}
          </div>
          {assignment.teacherNote && (
            <div className="mt-2 text-xs text-text-muted italic flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-text-muted shrink-0" />
              {assignment.teacherNote}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
