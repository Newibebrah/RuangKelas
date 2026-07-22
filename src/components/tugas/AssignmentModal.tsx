"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Assignment } from "@/types";
import { HiPaperClip, HiX } from "react-icons/hi";

const schema = z
  .object({
    subject: z.string().min(1, "Mata pelajaran wajib diisi"),
    description: z
      .string()
      .min(1, "Deskripsi wajib diisi")
      .max(500, "Deskripsi maksimal 500 karakter"),
    deadline: z.string().min(1, "Deadline wajib diisi"),
    teacherNote: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
  })
  .refine(
    (data) => {
      if (!data.deadline) return true;
      return new Date(data.deadline) > new Date();
    },
    { message: "Deadline harus berupa waktu yang akan datang", path: ["deadline"] }
  )
  .refine(
    (data) => {
      if (!data.deadline) return true;
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      return new Date(data.deadline) <= maxDate;
    },
    { message: "Deadline maksimal 1 tahun dari sekarang", path: ["deadline"] }
  );

type FormData = z.infer<typeof schema>;

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: Assignment | null;
  onSubmit: (data: {
    subject: string;
    description: string;
    deadline: Timestamp;
    teacherNote?: string;
    files?: File[];
  }) => Promise<void>;
}

export function AssignmentModal({
  isOpen,
  onClose,
  assignment,
  onSubmit,
}: AssignmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      if (assignment) {
        const d = assignment.deadline.toDate();
        const localStr = new Date(
          d.getTime() - d.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        reset({
          subject: assignment.subject,
          description: assignment.description,
          deadline: localStr,
          teacherNote: assignment.teacherNote || "",
        });
      } else {
        reset({
          subject: "",
          description: "",
          deadline: "",
          teacherNote: "",
        });
      }
    }
  }, [isOpen, assignment, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        subject: data.subject,
        description: data.description,
        deadline: Timestamp.fromDate(new Date(data.deadline)),
        teacherNote: data.teacherNote || undefined,
        files: files.length ? files : undefined,
      });
      toast.success(assignment ? "Tugas berhasil diupdate!" : "Tugas berhasil dibuat!");
      setFiles([]);
      reset();
      onClose();
    } catch {
      toast.error(assignment ? "Gagal mengupdate tugas" : "Gagal membuat tugas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignment ? "Edit Tugas" : "Tugas Baru"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Mata Pelajaran"
          placeholder="Contoh: Matematika"
          error={errors.subject?.message}
          {...register("subject")}
        />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Deskripsi
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.description ? "border-red-500" : "border-border"
            }`}
            rows={3}
            placeholder="Deskripsi tugas"
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>
        <Input
          label="Deadline"
          type="datetime-local"
          error={errors.deadline?.message}
          {...register("deadline")}
        />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Catatan Guru <span className="text-text-muted">(opsional)</span>
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.teacherNote ? "border-red-500" : "border-border"
            }`}
            rows={2}
            placeholder="Catatan tambahan (opsional)"
            {...register("teacherNote")}
          />
          {errors.teacherNote && (
            <p className="mt-1 text-sm text-red-600">
              {errors.teacherNote.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Lampiran <span className="text-text-muted">(opsional)</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg"
              >
                <HiPaperClip className="h-3 w-3" />
                {f.name}
                <button type="button" onClick={() => removeFile(i)} className="hover:text-red-600">
                  <HiX className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setFiles([]);
              reset();
              onClose();
            }}
          >
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {assignment ? "Simpan" : "Buat Tugas"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
