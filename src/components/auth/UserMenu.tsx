"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { HiLogout, HiUser, HiPencil } from "react-icons/hi";
import toast from "react-hot-toast";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { updateProfile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim() });
      toast.success("Profil berhasil diperbarui!");
      setProfileOpen(false);
    } catch {
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <HiUser className="h-5 w-5 text-blue-600" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.displayName}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {user.displayName}
              </p>
              <p className="text-xs text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full capitalize">
                {user.role}
              </span>
            </div>
            <button
              onClick={() => {
                setDisplayName(user.displayName);
                setProfileOpen(true);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HiPencil className="h-4 w-4" />
              Edit Profil
            </button>
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HiLogout className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </>
      )}

      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Edit Profil"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nama Tampilan"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nama Anda"
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setProfileOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveProfile} isLoading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
