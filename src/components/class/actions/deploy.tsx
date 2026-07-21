"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadFile, generateFilePath } from "@/lib/upload";
import { notifyAllMembers } from "@/lib/notifications";
import { useAuth } from "@/lib/auth-context";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { HiUpload, HiX, HiPaperClip, HiDocumentText } from "react-icons/hi";

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function DeployModal({ isOpen, onClose, roomId }: DeployModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    },
    maxSize: 10 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const attachmentUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = generateFilePath(roomId, "deploy", file.name);
        const url = await uploadFile(file, path, (progress) => {
          const overall =
            ((i + progress.progress / 100) / files.length) * 100;
          setUploadProgress(Math.round(overall));
        });
        attachmentUrls.push(url);
      }

      await addDoc(collection(db, "deployments"), {
        roomId,
        title: title.trim(),
        description: description.trim(),
        attachments: attachmentUrls,
        createdBy: user.id,
        createdAt: serverTimestamp(),
      });

      await notifyAllMembers(roomId, {
        type: "assignment",
        title: "Materi Baru",
        message: `"${title.trim()}" telah dibagikan`,
        roomId,
        link: `/room/${roomId}`,
      });

      toast.success("Materi berhasil dibagikan!");
      setTitle("");
      setDescription("");
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
    <Modal isOpen={isOpen} onClose={onClose} title="Bagikan Materi" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Judul
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Judul materi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi <span className="text-gray-400">(opsional)</span>
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Deskripsi materi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lampiran <span className="text-gray-400">(opsional)</span>
          </label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <HiUpload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Seret file ke sini, atau klik untuk pilih file
            </p>
            <p className="mt-1 text-xs text-gray-400">
              PDF, Word, Gambar (maks 10MB per file)
            </p>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <HiPaperClip className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
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
              <span className="text-sm text-gray-600">
                Mengunggah... {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
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
