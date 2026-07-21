"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AppHeader } from "@/components/ui/AppHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { HiArrowLeft, HiCamera, HiUser } from "react-icons/hi";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Maksimal ukuran foto 2MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Nama lengkap harus diisi");
      return;
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("Username hanya boleh huruf, angka, dan underscore");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        photoFile: photoFile || undefined,
        onUploadProgress: setUploadProgress,
      });
      toast.success("Profil berhasil disimpan!");
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan profil";
      console.error("handleSave error:", err);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-muted">
        <AppHeader
          left={
            <>
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
              >
                <HiArrowLeft className="h-5 w-5 text-text-secondary" />
              </button>
              <h1 className="text-lg font-semibold text-text-primary">Edit Profil</h1>
            </>
          }
        />

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-surface-hover flex items-center justify-center ring-4 ring-border">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Preview" width={96} height={96} className="h-full w-full object-cover" />
                ) : user.photoURL ? (
                  <Image src={user.photoURL} alt={user.displayName} width={96} height={96} className="h-full w-full object-cover" />
                ) : (
                  <HiUser className="h-10 w-10 text-text-muted" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-full shadow-md hover:bg-primary-700 transition-all active:scale-95"
              >
                <HiCamera className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-text-muted mt-2">Maks 2MB</p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-48 mt-3">
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
            <p className="px-3 py-2.5 bg-surface-muted border border-border rounded-xl text-sm text-text-muted">
              {user.email}
            </p>
          </div>

          {/* Nama Lengkap */}
          <Input
            label="Nama Lengkap"
            placeholder="Nama lengkap Anda"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          {/* Username */}
          <Input
            label="Username (opsional)"
            placeholder="@username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            prefix="@"
          />

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Bio <span className="text-text-muted">(opsional)</span>
            </label>
            <textarea
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-surface text-text-primary placeholder:text-text-muted resize-none"
              rows={3}
              placeholder="Tulis sesuatu tentang diri Anda"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-text-muted mt-1.5 text-right">{bio.length}/200</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => router.back()}>
              Batal
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
