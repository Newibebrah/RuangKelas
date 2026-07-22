"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { useSubmissions } from "@/hooks/useSubmissions";
import { usePengurus } from "@/hooks/usePengurus";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Assignment, Submission } from "@/types";
import { format, formatDistanceToNow, isAfter, differenceInHours } from "date-fns";
import { id } from "date-fns/locale/id";
import toast from "react-hot-toast";
import {
  HiArrowLeft,
  HiPaperClip,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiStar,
  HiUpload,
  HiUser,
  HiAcademicCap,
  HiCalendar,
  HiExclamation,
  HiDocumentText,
} from "react-icons/hi";

function getUrgency(deadline: { toDate: () => Date }) {
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

const urgencyColors = {
  overdue: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
  soon: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  upcoming: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
};

export default function TugasDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const tugasId = params.tugasId as string;
  const { user } = useAuth();
  const { members } = useRoom();
  const { pengurus } = usePengurus(roomId);
  const { submissions, loading: subLoading, submitWork, updateSubmission } = useSubmissions(tugasId);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadingAsg, setLoadingAsg] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";
  const isSekretaris = pengurus.some(
    (p) => p.userId === user?.id && p.jabatan.toLowerCase() === "sekretaris"
  );
  const canManage = isAdmin || isSekretaris;

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "tugas", tugasId), (snap) => {
      if (snap.exists()) {
        setAssignment({ id: snap.id, ...snap.data() } as Assignment);
      }
      setLoadingAsg(false);
    });
    return unsub;
  }, [tugasId]);

  const mySubmission = user
    ? submissions.find((s) => s.userId === user.id)
    : null;

  const pastDeadline = assignment
    ? assignment.deadline.toDate() < new Date()
    : false;

  const urgency = assignment ? getUrgency(assignment.deadline) : "upcoming";
  const uc = urgencyColors[urgency];

  const handleSubmit = async () => {
    if (!file || !user) return;
    setSubmitting(true);
    setUploadProgress(0);
    try {
      await submitWork({
        userId: user.id,
        displayName: user.displayName,
        roomId,
        file,
        notes: notes.trim() || undefined,
        onProgress: setUploadProgress,
      });
      toast.success("Tugas berhasil dikumpulkan!");
      setFile(null);
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Gagal mengumpulkan tugas");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleGrade = async (submission: Submission) => {
    const gradeStr = prompt("Masukkan nilai (0-100):", String(submission.grade ?? ""));
    if (gradeStr === null) return;
    const grade = parseInt(gradeStr);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast.error("Nilai harus antara 0-100");
      return;
    }
    const comment = prompt("Catatan (opsional):", submission.comment || "") || "";
    setGradingId(submission.id);
    try {
      await updateSubmission(submission.id, {
        grade,
        comment,
        gradedBy: user?.displayName || user?.id || "",
      });
      toast.success("Nilai berhasil disimpan!");
    } catch {
      toast.error("Gagal menyimpan nilai");
    } finally {
      setGradingId(null);
    }
  };

  if (loadingAsg) return <LoadingSkeleton count={3} />;
  if (!assignment) return <p className="text-text-muted">Tugas tidak ditemukan</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-3xl mx-auto pb-12"
    >
      <motion.button
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.back()}
        className="group flex items-center gap-2 px-4 py-2.5 mb-6 text-sm text-text-muted hover:text-text-primary bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 w-fit"
      >
        <HiArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Kembali
      </motion.button>

      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${uc.dot}`} />
        <span className={`text-xs font-medium ${uc.text}`}>
          {pastDeadline ? "Terlewat" : "Aktif"}
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-6 leading-tight">
        {assignment.subject}
      </h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${uc.badge}`}>
          <HiClock className="h-3.5 w-3.5" />
          {pastDeadline
            ? `Terlewat ${formatDistanceToNow(assignment.deadline.toDate(), { locale: id })}`
            : formatDistanceToNow(assignment.deadline.toDate(), { locale: id, addSuffix: true })}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-muted dark:bg-slate-800 text-text-secondary">
          <HiCalendar className="h-3.5 w-3.5" />
          {format(assignment.deadline.toDate(), "d MMM yyyy, HH:mm", { locale: id })}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-muted dark:bg-slate-800 text-text-secondary">
          <HiUser className="h-3.5 w-3.5" />
          {assignment.createdBy ? "Dibuat oleh guru" : "Guru"}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-700/50 shadow-sm p-6 mb-6">
        {assignment.description && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <HiDocumentText className="h-4 w-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Deskripsi
              </h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>
        )}

        {assignment.teacherNote && (
          <div className={`p-4 rounded-xl ${uc.bg} border ${uc.border} mb-5`}>
            <div className="flex items-start gap-2">
              <HiExclamation className={`h-4 w-4 mt-0.5 ${uc.text} shrink-0`} />
              <div>
                <p className={`text-xs font-semibold ${uc.text} mb-0.5`}>Catatan Guru</p>
                <p className="text-sm text-text-secondary italic">{assignment.teacherNote}</p>
              </div>
            </div>
          </div>
        )}

        {assignment.attachments?.length ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HiPaperClip className="h-4 w-4 text-text-muted" />
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                Lampiran ({assignment.attachments.length})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {assignment.attachments.map((url, i) => (
                <motion.a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-200 dark:border-primary-800 transition-colors shadow-sm"
                >
                  <HiPaperClip className="h-4 w-4" />
                  <span className="font-medium">Lampiran {i + 1}</span>
                  <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {!canManage && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-700/50 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-1.5 rounded-lg ${mySubmission ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-primary-50 dark:bg-primary-900/20 text-primary-600"}`}>
              {mySubmission ? <HiCheckCircle className="h-4 w-4" /> : <HiUpload className="h-4 w-4" />}
            </div>
            <h3 className="font-semibold text-text-primary">
              {mySubmission ? "Tugas Terkumpul" : "Kumpulkan Tugas"}
            </h3>
          </div>

          {mySubmission ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                <HiCheckCircle className="h-5 w-5" />
                Terkumpul{" "}
                {mySubmission.submittedAt
                  ? formatDistanceToNow(mySubmission.submittedAt.toDate(), {
                      locale: id,
                      addSuffix: true,
                    })
                  : ""}
              </div>
              <motion.a
                href={mySubmission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -1 }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors"
              >
                <HiPaperClip className="h-4 w-4" />
                Lihat File
              </motion.a>
              {mySubmission.notes && (
                <div className="p-3 bg-surface-muted dark:bg-slate-800 rounded-xl">
                  <p className="text-xs text-text-muted mb-0.5">Catatan:</p>
                  <p className="text-sm text-text-secondary">{mySubmission.notes}</p>
                </div>
              )}
              {mySubmission.grade !== undefined && (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded-xl border border-green-200 dark:border-green-800">
                  <HiStar className="h-4 w-4" />
                  <span className="font-semibold">Nilai: {mySubmission.grade}</span>
                  {mySubmission.comment && (
                    <span className="text-text-muted font-normal">— {mySubmission.comment}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-5 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors group"
              >
                <HiUpload className="h-6 w-6 mx-auto text-text-muted group-hover:text-primary-500 transition-colors" />
                <p className="text-sm text-text-muted mt-1 group-hover:text-text-primary transition-colors">
                  {file ? file.name : "Klik untuk upload file tugas"}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>
              <textarea
                className="w-full px-4 py-3 border border-border dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-slate-800/50"
                rows={2}
                placeholder="Catatan (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {uploadProgress > 0 && (
                <div className="w-full bg-border dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                  />
                </div>
              )}
              <Button
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={!file}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-blue-500/25"
              >
                <HiUpload className="h-4 w-4 mr-1.5" />
                Kumpulkan
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {canManage && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-border dark:border-slate-700/50 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-surface-muted dark:bg-slate-800 text-text-secondary">
                <HiAcademicCap className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-text-primary">
                Pengumpulan
              </h3>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-surface-muted dark:bg-slate-800 text-text-secondary">
              {submissions.length} siswa
            </span>
          </div>

          {subLoading ? (
            <LoadingSkeleton count={2} />
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <HiDocumentText className="h-8 w-8 mx-auto text-text-muted mb-2" />
              <p className="text-sm text-text-muted">Belum ada pengumpulan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between p-3.5 bg-surface-muted dark:bg-slate-800/50 rounded-xl hover:bg-surface-hover dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {sub.displayName.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-text-primary truncate">
                        {sub.displayName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 ml-9">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      >
                        <HiPaperClip className="h-3 w-3" />
                        Lihat File
                      </a>
                      {sub.submittedAt && (
                        <span className="text-xs text-text-muted">
                          {formatDistanceToNow(sub.submittedAt.toDate(), {
                            locale: id,
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    {sub.notes && (
                      <p className="text-xs text-text-muted mt-1 ml-9 italic">{sub.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {sub.grade !== undefined ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                        <HiCheckCircle className="h-3 w-3" />
                        {sub.grade}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                        <HiXCircle className="h-3 w-3" />
                        Belum
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGrade(sub)}
                      isLoading={gradingId === sub.id}
                      className="text-xs"
                    >
                      Nilai
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
