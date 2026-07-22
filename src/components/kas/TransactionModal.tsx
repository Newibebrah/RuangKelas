"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Kas } from "@/types";
import { Timestamp } from "firebase/firestore";
import { HiTrendingUp, HiTrendingDown } from "react-icons/hi";

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
      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Tipe
          </label>
          <div className="flex gap-2 p-1 bg-surface-hover rounded-2xl">
            <button
              type="button"
              onClick={() => setType("pemasukan")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                type === "pemasukan"
                  ? "bg-white dark:bg-slate-800 text-success shadow-sm shadow-success/10 ring-1 ring-success/20"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <HiTrendingUp className="h-4 w-4" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setType("pengeluaran")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                type === "pengeluaran"
                  ? "bg-white dark:bg-slate-800 text-danger shadow-sm shadow-danger/10 ring-1 ring-danger/20"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <HiTrendingDown className="h-4 w-4" />
              Pengeluaran
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative"
        >
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Nominal
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">
              Rp
            </span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Kategori
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 appearance-none"
          >
            <option value="">Pilih kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="relative"
        >
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Deskripsi
          </label>
          <textarea
            placeholder="Deskripsi transaksi"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all duration-200 resize-none"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex justify-end gap-3 pt-2"
        >
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
          >
            {editing ? "Simpan" : "Tambah"}
          </Button>
        </motion.div>
      </form>
    </Modal>
  );
}
