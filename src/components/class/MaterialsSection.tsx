"use client";

import { useState } from "react";
import { Material } from "@/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  HiDocumentText,
  HiTrash,
  HiDownload,
} from "react-icons/hi";

interface MaterialsSectionProps {
  materials: Material[];
  canManage: boolean;
  onDelete: (material: Material) => Promise<void>;
}

const SUBJECT_COLORS: Record<string, string> = {
  matematika: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "bahasa indonesia": "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  "bahasa inggris": "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  ipa: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  ips: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
};

function getSubjectColor(name: string): string {
  const key = name.toLowerCase();
  return SUBJECT_COLORS[key] || "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300";
}

export function MaterialsSection({
  materials,
  canManage,
  onDelete,
}: MaterialsSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget);
      toast.success("Materi berhasil dihapus");
      setDeleteTarget(null);
    } catch {
      toast.error("Gagal menghapus materi");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (m: Material) => {
    if (!m.createdAt || typeof m.createdAt.toDate !== "function") return "";
    return format(m.createdAt.toDate(), "dd MMM yyyy, HH:mm", { locale: id });
  };

  const getFileIcon = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    if (["xls", "xlsx"].includes(ext || "")) return "📊";
    if (["ppt", "pptx"].includes(ext || "")) return "📑";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
    return "📎";
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-8">
        <HiDocumentText className="mx-auto h-10 w-10 text-text-muted" />
        <p className="mt-2 text-sm text-text-muted">Belum ada materi pelajaran</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {materials.map((m) => (
        <Card key={m.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-text-primary truncate">
                    {m.title}
                  </h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getSubjectColor(m.subject)}`}>
                    {m.subject}
                  </span>
                </div>
                {m.description && (
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">
                    {m.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  {m.displayName && <span>{m.displayName}</span>}
                  <span>{formatDate(m)}</span>
                  <span>{m.attachments.length} file(s)</span>
                </div>
                {m.attachments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {m.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-muted rounded-lg hover:bg-surface-hover transition-colors text-sm text-text-secondary"
                      >
                        <span>{getFileIcon(url)}</span>
                        <span className="truncate flex-1">
                          {url.split("/").pop()?.replace(/^\d+_/, "") || `File ${i + 1}`}
                        </span>
                        <HiDownload className="h-4 w-4 text-text-muted shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {canManage && (
                <button
                  onClick={() => setDeleteTarget(m)}
                  className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Hapus materi"
                >
                  <HiTrash className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardBody>
        </Card>
      ))}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Materi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Apakah Anda yakin ingin menghapus materi{" "}
            <strong>{deleteTarget?.title}</strong>? File akan dihapus permanen.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
