"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Assignment } from "@/types";

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
  }) => Promise<void>;
}

export function AssignmentModal({
  isOpen,
  onClose,
  assignment,
  onSubmit,
}: AssignmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

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

  const onFormSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        subject: data.subject,
        description: data.description,
        deadline: Timestamp.fromDate(new Date(data.deadline)),
        teacherNote: data.teacherNote || undefined,
      });
      toast.success(assignment ? "Tugas berhasil diupdate!" : "Tugas berhasil dibuat!");
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
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Mata Pelajaran"
          placeholder="Contoh: Matematika"
          error={errors.subject?.message}
          {...register("subject")}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.description ? "border-red-500" : "border-gray-300"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catatan Guru <span className="text-gray-400">(opsional)</span>
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.teacherNote ? "border-red-500" : "border-gray-300"
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
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
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
