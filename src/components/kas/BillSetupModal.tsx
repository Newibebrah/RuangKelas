"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  amount: z.number().positive("Nominal harus lebih dari 0"),
  frequency: z.enum(["weekly", "monthly"] as const),
  periodsPerMonth: z
    .number()
    .int("Harus bilangan bulat")
    .min(1, "Minimal 1 periode")
    .max(10, "Maksimal 10 periode"),
});

type FormData = z.infer<typeof schema>;

interface BillSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    frequency: "weekly" | "monthly";
    periodsPerMonth: number;
  }) => Promise<void>;
}

export function BillSetupModal({
  isOpen,
  onClose,
  onSubmit,
}: BillSetupModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined,
      frequency: "monthly",
      periodsPerMonth: 4,
    },
  });

  const onFormSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        amount: data.amount,
        frequency: data.frequency,
        periodsPerMonth: data.periodsPerMonth,
      });
      toast.success("Tagihan berhasil dibuat!");
      reset();
      onClose();
    } catch {
      toast.error("Gagal membuat tagihan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buat Tagihan Baru">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input
          label="Nominal per Periode"
          type="number"
          placeholder="Contoh: 50000"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frekuensi
          </label>
          <select
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.frequency ? "border-red-500" : "border-gray-300"
            }`}
            {...register("frequency")}
          >
            <option value="monthly">Bulanan</option>
            <option value="weekly">Mingguan</option>
          </select>
          {errors.frequency && (
            <p className="mt-1 text-sm text-red-600">
              {errors.frequency.message}
            </p>
          )}
        </div>

        <Input
          label="Jumlah Periode per Bulan"
          type="number"
          placeholder="Contoh: 4"
          error={errors.periodsPerMonth?.message}
          {...register("periodsPerMonth", { valueAsNumber: true })}
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
            Buat Tagihan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
