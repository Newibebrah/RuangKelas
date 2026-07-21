"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
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
  { value: "Ketua", label: "Ketua" },
  { value: "Wakil Ketua", label: "Wakil Ketua" },
  { value: "Sekretaris", label: "Sekretaris" },
  { value: "Bendahara", label: "Bendahara" },
  { value: "Anggota", label: "Anggota" },
];

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
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anggota
          </label>
          <p className="text-sm font-semibold text-gray-900">
            {pengurus.displayName}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jabatan
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
          >
            {JABATAN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
      </div>
    </Modal>
  );
}
