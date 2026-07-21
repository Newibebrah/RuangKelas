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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deskripsi
          </label>
          <textarea
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            rows={3}
            placeholder="Deskripsi singkat tentang kelas ini"
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
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
