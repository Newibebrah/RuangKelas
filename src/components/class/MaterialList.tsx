"use client";

import { useState } from "react";
import { Deployment } from "@/types";
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

interface MaterialListProps {
  deployments: Deployment[];
  canManage: boolean;
  onDelete: (deployment: Deployment) => Promise<void>;
}

export function MaterialList({
  deployments,
  canManage,
  onDelete,
}: MaterialListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Deployment | null>(null);
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

  const formatDate = (d: Deployment) => {
    if (!d.createdAt || typeof d.createdAt.toDate !== "function") return "";
    return format(d.createdAt.toDate(), "dd MMM yyyy, HH:mm", { locale: id });
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

  if (deployments.length === 0) {
    return (
      <div className="text-center py-12">
        <HiDocumentText className="mx-auto h-12 w-12 text-text-muted" />
        <p className="mt-3 text-sm text-text-muted">Belum ada materi</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deployments.map((d) => (
        <Card key={d.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-text-primary truncate">
                  {d.title}
                </h3>
                {d.description && (
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">
                    {d.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  {d.displayName && <span>{d.displayName}</span>}
                  <span>{formatDate(d)}</span>
                  <span>{d.attachments.length} file(s)</span>
                </div>
                {d.attachments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {d.attachments.map((url, i) => (
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
                  onClick={() => setDeleteTarget(d)}
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
