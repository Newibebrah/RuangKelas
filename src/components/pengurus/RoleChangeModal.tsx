"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Pengurus } from "@/types";
import toast from "react-hot-toast";

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengurus: Pengurus;
  onUpdateRole: (pengurusId: string, jabatan: string) => Promise<void>;
  onDelete: (pengurusId: string) => Promise<void>;
}

const JABATAN_OPTIONS = [
  { value: "Ketua", label: "Ketua", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "Wakil Ketua", label: "Wakil Ketua", color: "bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300" },
  { value: "Sekretaris", label: "Sekretaris", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  { value: "Bendahara", label: "Bendahara", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { value: "Anggota", label: "Anggota", color: "bg-surface-muted text-text-secondary" },
];

const roleIcons: Record<string, string> = {
  Ketua: "👑",
  "Wakil Ketua": "⚡",
  Sekretaris: "📋",
  Bendahara: "💰",
  Anggota: "👤",
};

export function RoleChangeModal({
  isOpen,
  onClose,
  pengurus,
  onUpdateRole,
  onDelete,
}: RoleChangeModalProps) {
  const [jabatan, setJabatan] = useState(pengurus.jabatan);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (jabatan === pengurus.jabatan) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onUpdateRole(pengurus.id, jabatan);
      toast.success("Jabatan berhasil diubah!");
      onClose();
    } catch {
      toast.error("Gagal mengubah jabatan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Hapus ${pengurus.displayName} dari kepengurusan?`))
      return;
    setSaving(true);
    try {
      await onDelete(pengurus.id);
      toast.success("Pengurus berhasil dihapus!");
      onClose();
    } catch {
      toast.error("Gagal menghapus pengurus");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubah Jabatan" size="sm">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-5"
      >
        <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-hover/50 dark:bg-slate-800/30">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
            {pengurus.displayName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {pengurus.displayName}
            </p>
            <span className="text-xs text-text-muted">
              {pengurus.jabatan}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Jabatan Baru
          </label>
          <div className="space-y-2">
            {JABATAN_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                  jabatan === o.value
                    ? "border-indigo-400 bg-indigo-50/60 dark:bg-indigo-900/20 dark:border-indigo-600 shadow-sm"
                    : "border-border hover:border-indigo-200 hover:bg-surface-hover/50 dark:hover:border-indigo-700/50"
                }`}
              >
                <input
                  type="radio"
                  name="jabatan"
                  value={o.value}
                  checked={jabatan === o.value}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-lg shrink-0">{roleIcons[o.value]}</span>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${o.color}`}>
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={saving}>
            Hapus
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </motion.div>
    </Modal>
  );
}
