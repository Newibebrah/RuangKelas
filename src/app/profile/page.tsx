"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        photoFile: photoFile || undefined,
        onUploadProgress: setUploadProgress,
      });
      toast.success("Profil berhasil disimpan!");
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch {
      toast.error("Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <HiArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Edit Profil</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="h-full w-full object-cover" />
                ) : (
                  <HiUser className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-colors"
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
            <p className="text-xs text-gray-400 mt-2">Maks 2MB</p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-48 mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio <span className="text-gray-400">(opsional)</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Tulis sesuatu tentang diri Anda"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/200</p>
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
