"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRoom } from "@/lib/room-context";

const schema = z.object({
  name: z.string().min(3, "Nama kelas minimal 3 karakter").max(100),
  description: z.string().min(10, "Deskripsi minimal 10 karakter").max(500),
});

type FormData = z.infer<typeof schema>;

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const { createRoom } = useRoom();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await createRoom(data.name, data.description);
      toast.success("Kelas berhasil dibuat!");
      reset();
      onClose();
    } catch {
      toast.error("Gagal membuat kelas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Kelas Baru">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nama Kelas"
          placeholder="Contoh: Kelas 7A"
          error={errors.name?.message}
          {...register("name")}
        />
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Deskripsi
          </label>
          <textarea
            className={`w-full px-3 py-2.5 border rounded-xl text-sm transition-all duration-200 outline-none resize-none ${
              errors.description
                ? "border-danger focus:ring-2 focus:ring-danger/20 focus:border-danger"
                : "border-border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            } bg-surface text-text-primary placeholder:text-text-muted`}
            rows={3}
            placeholder="Deskripsi singkat tentang kelas ini"
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs font-medium text-danger flex items-center gap-1">
              <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.description.message}
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
            Buat Kelas
          </Button>
        </div>
      </form>
    </Modal>
  );
}
