"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { useSubmissions } from "@/hooks/useSubmissions";
import { usePengurus } from "@/hooks/usePengurus";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { Assignment, Submission } from "@/types";
import { formatDistanceToNow } from "date-fns";
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
} from "react-icons/hi";

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
  if (!assignment) return <p className="text-gray-500">Tugas tidak ditemukan</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <HiArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{assignment.subject}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {assignment.description}
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
              pastDeadline
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <HiClock className="h-3 w-3" />
            {pastDeadline
              ? `Terlewat ${formatDistanceToNow(assignment.deadline.toDate(), { locale: id })}`
              : formatDistanceToNow(assignment.deadline.toDate(), { locale: id, addSuffix: true })}
          </span>
        </div>

        {assignment.teacherNote && (
          <p className="text-sm text-gray-500 italic">
            Catatan: {assignment.teacherNote}
          </p>
        )}

        {assignment.attachments?.length ? (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Lampiran
            </p>
            <div className="flex flex-wrap gap-2">
              {assignment.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100"
                >
                  <HiPaperClip className="h-4 w-4" />
                  Lampiran {i + 1}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {!canManage && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">
            {mySubmission ? "Tugas Terkumpul" : "Kumpulkan Tugas"}
          </h3>

          {mySubmission ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <HiCheckCircle className="h-5 w-5" />
                Terkumpul{" "}
                {mySubmission.submittedAt
                  ? formatDistanceToNow(mySubmission.submittedAt.toDate(), {
                      locale: id,
                      addSuffix: true,
                    })
                  : ""}
              </div>
              <a
                href={mySubmission.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100"
              >
                <HiPaperClip className="h-4 w-4" />
                Lihat File
              </a>
              {mySubmission.notes && (
                <p className="text-sm text-gray-500">Catatan: {mySubmission.notes}</p>
              )}
              {mySubmission.grade !== undefined && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-lg">
                  <HiStar className="h-4 w-4" />
                  Nilai: {mySubmission.grade}
                  {mySubmission.comment && (
                    <span className="text-gray-500">— {mySubmission.comment}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Catatan (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <Button
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={!file}
              >
                <HiUpload className="h-4 w-4 mr-1" />
                Kumpulkan
              </Button>
            </div>
          )}
        </div>
      )}

      {canManage && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">
            Pengumpulan ({submissions.length})
          </h3>

          {subLoading ? (
            <LoadingSkeleton count={2} />
          ) : submissions.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada pengumpulan</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sub.displayName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        <HiPaperClip className="h-3 w-3 inline mr-0.5" />
                        Lihat File
                      </a>
                      {sub.submittedAt && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(sub.submittedAt.toDate(), {
                            locale: id,
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    {sub.notes && (
                      <p className="text-xs text-gray-500 mt-0.5">{sub.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {sub.grade !== undefined ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <HiCheckCircle className="h-3 w-3" />
                        {sub.grade}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        <HiXCircle className="h-3 w-3" />
                        Belum Dinilai
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGrade(sub)}
                      isLoading={gradingId === sub.id}
                    >
                      Nilai
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
