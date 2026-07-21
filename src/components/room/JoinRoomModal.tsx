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
  code: z
    .string()
    .length(6, "Kode kelas harus 6 karakter")
    .regex(/^[a-zA-Z0-9]+$/, "Kode kelas hanya boleh huruf dan angka"),
});

type FormData = z.infer<typeof schema>;

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const { joinRoom } = useRoom();
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
      await joinRoom(data.code);
      toast.success("Berhasil bergabung ke kelas!");
      reset();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal bergabung ke kelas"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gabung Kelas">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Kode Kelas"
          placeholder="Masukkan kode kelas"
          error={errors.code?.message}
          {...register("code")}
        />
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
            Gabung
          </Button>
        </div>
      </form>
    </Modal>
  );
}
