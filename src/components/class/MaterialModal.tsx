"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { HiUpload, HiX, HiPaperClip, HiDocumentText } from "react-icons/hi";

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  initialSubject?: string;
  onSubmit: (data: {
    title: string;
    description?: string;
    subject: string;
    files: File[];
    onProgress?: (progress: number) => void;
  }) => Promise<void>;
}

export function MaterialModal({ isOpen, onClose, subjects, initialSubject, onSubmit }: MaterialModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject || "");
    }
  }, [isOpen, initialSubject]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/vnd.ms-powerpoint": [],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul harus diisi");
      return;
    }
    if (!subject) {
      toast.error("Mata pelajaran harus dipilih");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        subject,
        files,
        onProgress: setUploadProgress,
      });
      toast.success("Materi berhasil dibagikan!");
      setTitle("");
      setDescription("");
      setSubject("");
      setFiles([]);
      onClose();
    } catch {
      toast.error("Gagal membagikan materi");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Materi Baru" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Judul
          </label>
          <input
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Judul materi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Mata Pelajaran
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800/50"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          >
            <option value="">Pilih matkul...</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Deskripsi <span className="text-text-muted">(opsional)</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Deskripsi materi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Lampiran <span className="text-text-muted">(opsional)</span>
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-border hover:border-border"
            }`}
          >
            <input {...getInputProps()} />
            <HiUpload className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-2 text-sm text-text-muted">
              Seret file ke sini, atau klik untuk pilih file
            </p>
            <p className="mt-1 text-xs text-text-muted">
              PDF, Word, Excel, PPT, Gambar (maks 10MB per file)
            </p>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-surface-muted rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HiPaperClip className="h-4 w-4 text-text-muted shrink-0" />
                    <span className="text-sm text-text-secondary truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-text-muted shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1 text-text-muted hover:text-red-600 rounded transition-colors"
                  >
                    <HiX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {uploading && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HiDocumentText className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-text-secondary">
                Mengunggah... {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={uploading}>
            Bagikan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
