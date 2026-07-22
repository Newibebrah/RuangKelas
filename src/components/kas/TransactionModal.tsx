"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Kas } from "@/types";
import { Timestamp } from "firebase/firestore";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    type: "pemasukan" | "pengeluaran";
    description: string;
    category: string;
    date: Timestamp;
  }) => Promise<void>;
  editing?: Kas | null;
}

const CATEGORIES = [
  "Iuran",
  "Dana Kelas",
  "Peralatan",
  "Kegiatan",
  "Dekorasi",
  "Lainnya",
];

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  editing,
}: TransactionModalProps) {
  const [type, setType] = useState<"pemasukan" | "pengeluaran">(
    editing?.type || "pemasukan"
  );
  const [amount, setAmount] = useState(editing?.amount?.toString() || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [category, setCategory] = useState(editing?.category || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!description.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit({
        amount: numAmount,
        type,
        description: description.trim(),
        category: category || "Lainnya",
        date: editing?.date || Timestamp.now(),
      });
      onClose();
    } catch {
      // toast handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit Transaksi" : "Tambah Transaksi"}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Tipe
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("pemasukan")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                type === "pemasukan"
                  ? "bg-green-100 text-green-700 ring-2 ring-green-500"
                  : "bg-surface-muted text-text-muted hover:bg-surface-hover"
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType("pengeluaran")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                type === "pengeluaran"
                  ? "bg-red-100 text-red-700 ring-2 ring-red-500"
                  : "bg-surface-muted text-text-muted hover:bg-surface-hover"
              }`}
            >
              Pengeluaran
            </button>
          </div>
        </div>

        <Input
          label="Nominal (Rp)"
          type="number"
          placeholder="Contoh: 50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Kategori
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Pilih kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Deskripsi"
          placeholder="Deskripsi transaksi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {editing ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
