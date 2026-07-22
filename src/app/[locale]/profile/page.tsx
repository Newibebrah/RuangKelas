"use client";

import { useState, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useProfile } from "@/hooks/useProfile";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AppHeader } from "@/components/ui/AppHeader";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { motion } from "framer-motion";
import { HiArrowLeft, HiCamera, HiUser, HiMail, HiCalendar, HiBadgeCheck } from "react-icons/hi";
import toast from "react-hot-toast";

const formatDate = (timestamp: { seconds?: number; toDate?: () => Date } | undefined) => {
  if (!timestamp) return "-";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds! * 1000);
    return new Intl.DateTimeFormat("id-ID", { year: "numeric", month: "long", day: "numeric" }).format(date);
  } catch {
    return "-";
  }
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
  pengurus: "Pengurus",
};

const roleColors: Record<string, string> = {
  admin: "bg-gradient-to-r from-amber-500 to-orange-600",
  guru: "bg-gradient-to-r from-blue-500 to-indigo-600",
  siswa: "bg-gradient-to-r from-emerald-500 to-teal-600",
  pengurus: "bg-gradient-to-r from-purple-500 to-pink-600",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function ProfilePage() {
  const { t } = useLocale();
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
              <h1 className="text-lg font-semibold text-text-primary">{t('auth.editProfile')}</h1>
            </>
          }
        />

        <motion.div
          className="max-w-2xl mx-auto px-4 py-8 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Avatar Section */}
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[3px]">
                <div className="w-full h-full rounded-full bg-surface-muted" />
              </div>
              <div className="relative h-28 w-28 rounded-full overflow-hidden bg-surface-hover flex items-center justify-center ring-[3px] ring-surface">
                {photoPreview ? (
                  <Image src={photoPreview} alt="Preview" width={112} height={112} className="h-full w-full object-cover" />
                ) : user.photoURL ? (
                  <Image src={user.photoURL} alt={user.displayName} width={112} height={112} className="h-full w-full object-cover" />
                ) : (
                  <HiUser className="h-12 w-12 text-text-muted" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
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
            <h2 className="text-2xl font-bold text-text-primary">{user.displayName}</h2>
            <p className="text-text-muted text-sm mt-1">{user.email}</p>
            {user.username && (
              <p className="text-sm text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">@{user.username}</p>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-48 mt-4">
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Info Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface rounded-2xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <HiMail className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Email</p>
              </div>
              <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
            </div>

            <div className="bg-surface rounded-2xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <HiCalendar className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Bergabung sejak</p>
              </div>
              <p className="text-sm font-medium text-text-primary">{formatDate(user.createdAt)}</p>
            </div>

            <div className="bg-surface rounded-2xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <HiBadgeCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Peran di Kelas</p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold text-white ${roleColors[user.role] || "bg-gradient-to-r from-gray-500 to-gray-600"}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          </motion.div>

          {/* Edit Form */}
          <motion.div variants={itemVariants} className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-5">
            <h3 className="text-lg font-semibold text-text-primary">Edit Profil</h3>

            <Input
              label={t('profile.fullName')}
              placeholder={t('profile.fullNamePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <Input
              label={t('profile.username')}
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              prefix="@"
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {t('profile.bio')} <span className="text-text-muted">{t('profile.optional')}</span>
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-surface text-text-primary placeholder:text-text-muted resize-none"
                rows={3}
                placeholder={t('profile.bioPlaceholder')}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-text-muted mt-1.5 text-right">{bio.length}/200</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => router.back()}>
                {t('action.cancel')}
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                {t('action.save')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
