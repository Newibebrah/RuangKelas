"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Assignment } from "@/types";
import { HiPaperClip, HiX, HiDocumentAdd } from "react-icons/hi";

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

const panelVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", damping: 28, stiffness: 300, mass: 0.8 } as const,
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2, ease: "easeIn" } as const,
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } as const },
  exit: { opacity: 0, transition: { duration: 0.15 } as const },
};

export function AssignmentModal({
  isOpen,
  onClose,
  assignment,
  onSubmit,
}: AssignmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={assignment ? "Edit Tugas" : "Tugas Baru"}
            className="relative w-full max-w-lg h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl border-l border-white/20 dark:border-slate-700/30 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-light dark:border-slate-700/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
                  <HiDocumentAdd className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {assignment ? "Edit Tugas" : "Tugas Baru"}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {assignment ? "Perbarui informasi tugas" : "Buat tugas baru untuk kelas"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover dark:hover:bg-slate-800 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
                <Input
                  label="Mata Pelajaran"
                  placeholder="Contoh: Matematika"
                  error={errors.subject?.message}
                  {...register("subject")}
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-slate-800/50 ${
                      errors.description
                        ? "border-red-400 dark:border-red-500"
                        : "border-border dark:border-slate-700"
                    }`}
                    rows={4}
                    placeholder="Deskripsi tugas"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
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
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Catatan Guru{" "}
                    <span className="text-text-muted font-normal">(opsional)</span>
                  </label>
                  <textarea
                    className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-slate-800/50 ${
                      errors.teacherNote
                        ? "border-red-400 dark:border-red-500"
                        : "border-border dark:border-slate-700"
                    }`}
                    rows={2}
                    placeholder="Catatan tambahan (opsional)"
                    {...register("teacherNote")}
                  />
                  {errors.teacherNote && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                      {errors.teacherNote.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Lampiran{" "}
                    <span className="text-text-muted font-normal">(opsional)</span>
                  </label>
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {files.map((f, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-xl border border-blue-200 dark:border-blue-800"
                        >
                          <HiPaperClip className="h-3.5 w-3.5" />
                          <span className="max-w-[120px] truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="hover:text-red-600 dark:hover:text-red-400 ml-0.5 transition-colors"
                          >
                            <HiX className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative border-2 border-dashed border-border dark:border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors group"
                  >
                    <HiPaperClip className="h-6 w-6 mx-auto text-text-muted group-hover:text-primary-500 transition-colors" />
                    <p className="text-sm text-text-muted mt-1 group-hover:text-text-primary transition-colors">
                      Klik untuk upload file
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      PDF, DOC, ZIP — maks 10MB
                    </p>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="shrink-0 px-6 py-5 border-t border-border-light dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setFiles([]);
                    reset();
                    onClose();
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                  onClick={handleSubmit(onFormSubmit)}
                >
                  {assignment ? "Simpan" : "Buat Tugas"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
