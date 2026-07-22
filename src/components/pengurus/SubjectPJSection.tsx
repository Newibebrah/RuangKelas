"use client";

import { useState } from "react";
import { useSubjectPJ } from "@/hooks/useSubjectPJ";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  HiBookOpen,
  HiPlus,
  HiTrash,
  HiUserAdd,
  HiUser,
  HiPencil,
} from "react-icons/hi";
import { motion } from "framer-motion";
import { MemberOption } from "./types";
import toast from "react-hot-toast";

const subjectEmojis: Record<string, string> = {
  matematika: "📐",
  "bahasa indonesia": "📖",
  "bahasa inggris": "🌍",
  ipa: "🔬",
  ips: "🌏",
  ppkn: "⚖️",
  agama: "🕌",
  "seni budaya": "🎨",
  "penjaskes": "⚽",
  prakarya: "🛠️",
  informatika: "💻",
};

const pastelColors = [
  "from-pink-100 to-rose-200 dark:from-pink-900/30 dark:to-rose-900/30",
  "from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-900/30",
  "from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-900/30",
  "from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/30",
  "from-violet-100 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30",
  "from-lime-100 to-green-200 dark:from-lime-900/30 dark:to-green-900/30",
  "from-cyan-100 to-indigo-200 dark:from-cyan-900/30 dark:to-indigo-900/30",
  "from-fuchsia-100 to-pink-200 dark:from-fuchsia-900/30 dark:to-pink-900/30",
];

function getSubjectColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return pastelColors[Math.abs(hash) % pastelColors.length];
}

function getSubjectEmoji(name: string) {
  const key = name.toLowerCase();
  return subjectEmojis[key] || "📚";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

interface SubjectPJSectionProps {
  roomId: string;
  canManage: boolean;
  members: MemberOption[];
}

export function SubjectPJSection({
  roomId,
  canManage,
  members,
}: SubjectPJSectionProps) {
  const { subjects, loading, error, addSubject, updateSubject, assignPJ, deleteSubject } =
    useSubjectPJ(roomId);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [kkm, setKkm] = useState("");
  const [semester, setSemester] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setSubjectName("");
    setKkm("");
    setSemester("");
  };

  const handleAdd = async () => {
    if (!subjectName.trim()) return;
    setIsLoading(true);
    try {
      await addSubject({
        subjectName: subjectName.trim(),
        kkm: kkm ? parseInt(kkm) : undefined,
        semester: semester || undefined,
      });
      toast.success("Mata pelajaran ditambahkan!");
      resetForm();
      setAddOpen(false);
    } catch {
      toast.error("Gagal menambah mata pelajaran");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editOpen || !subjectName.trim()) return;
    setIsLoading(true);
    try {
      await updateSubject(editOpen, {
        subjectName: subjectName.trim(),
        kkm: kkm ? parseInt(kkm) : undefined,
        semester: semester || undefined,
      });
      toast.success("Mata pelajaran diperbarui!");
      setEditOpen(null);
      resetForm();
    } catch {
      toast.error("Gagal memperbarui mata pelajaran");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignOpen || !selectedUser) return;
    setIsLoading(true);
    try {
      const member = members.find((m) => m.userId === selectedUser);
      await assignPJ(assignOpen, selectedUser, member?.displayName || null);
      toast.success("PJ berhasil ditugaskan!");
      setAssignOpen(null);
      setSelectedUser("");
    } catch {
      toast.error("Gagal menugaskan PJ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassign = async (subjectId: string) => {
    try {
      await assignPJ(subjectId, null, null);
      toast.success("PJ berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus PJ");
    }
  };

  const handleDelete = async (subjectId: string, name: string) => {
    if (!window.confirm(`Hapus mata pelajaran "${name}"?`)) return;
    try {
      await deleteSubject(subjectId);
      toast.success("Mata pelajaran dihapus!");
    } catch {
      toast.error("Gagal menghapus mata pelajaran");
    }
  };

  const openEdit = (s: typeof subjects[0]) => {
    setSubjectName(s.subjectName);
    setKkm(s.kkm?.toString() || "");
    setSemester(s.semester || "");
    setEditOpen(s.id);
  };

  if (loading) return <LoadingSkeleton variant="card" count={2} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          PJ Mata Pelajaran
        </h3>
        {canManage && (
          <Button size="sm" onClick={() => { resetForm(); setAddOpen(true); }}>
            <HiPlus className="h-4 w-4 mr-1" />
            Tambah Mapel
          </Button>
        )}
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={<HiBookOpen className="h-12 w-12" />}
          title="Belum ada mata pelajaran"
          description={
            canManage
              ? "Tambahkan mata pelajaran dan tugaskan PJ"
              : "Ketua belum menambahkan mata pelajaran"
          }
        />
      ) : (
        <motion.div
          className="grid gap-4 grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {subjects.map((s) => {
            const member = members.find((m) => m.userId === s.userId);
            const color = getSubjectColor(s.subjectName);
            const emoji = getSubjectEmoji(s.subjectName);
            return (
              <motion.div key={s.id} variants={cardVariants} className="group">
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
                  <div className={`bg-gradient-to-br ${color} px-5 pt-5 pb-4`}>
                    <div className="flex items-start justify-between">
                      <span className="text-3xl" role="img" aria-label={s.subjectName}>
                        {emoji}
                      </span>
                      {canManage && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit mapel"
                          >
                            <HiPencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.subjectName)}
                            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition-colors"
                            title="Hapus mapel"
                          >
                            <HiTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-text-primary mt-3 text-sm leading-tight">
                      {s.subjectName}
                    </h4>
                  </div>
                  <CardBody className="!px-5 !py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {s.userId && member ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                              <HiUser className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-xs font-medium text-text-primary truncate">
                              {member.displayName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">
                            Belum ada PJ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {canManage && (
                          <>
                            <button
                              onClick={() => {
                                setAssignOpen(s.id);
                                setSelectedUser(s.userId || "");
                              }}
                              className="p-1.5 text-text-muted hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                              title="Tugaskan PJ"
                            >
                              <HiUserAdd className="h-3.5 w-3.5" />
                            </button>
                            {s.userId && (
                              <button
                                onClick={() => handleUnassign(s.id)}
                                className="p-1.5 text-text-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                title="Hapus PJ"
                              >
                                <HiUser className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {s.kkm && (
                        <span className="text-[10px] px-2 py-0.5 font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-full">
                          KKM: {s.kkm}
                        </span>
                      )}
                      {s.semester && (
                        <span className="text-[10px] px-2 py-0.5 font-medium bg-surface-hover text-text-muted rounded-full">
                          {s.semester}
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); resetForm(); }}
        title="Tambah Mata Pelajaran"
      >
        <div className="space-y-4">
          <Input
            label="Nama Mata Pelajaran"
            placeholder="Contoh: Matematika"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
          <Input
            label="KKM (opsional)"
            type="number"
            placeholder="Contoh: 75"
            value={kkm}
            onChange={(e) => setKkm(e.target.value)}
          />
          <Input
            label="Semester (opsional)"
            placeholder="Contoh: Ganjil 2025"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setAddOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleAdd} isLoading={isLoading}>
              Tambah
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editOpen}
        onClose={() => { setEditOpen(null); resetForm(); }}
        title="Edit Mata Pelajaran"
      >
        <div className="space-y-4">
          <Input
            label="Nama Mata Pelajaran"
            placeholder="Contoh: Matematika"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
          <Input
            label="KKM (opsional)"
            type="number"
            placeholder="Contoh: 75"
            value={kkm}
            onChange={(e) => setKkm(e.target.value)}
          />
          <Input
            label="Semester (opsional)"
            placeholder="Contoh: Ganjil 2025"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => { setEditOpen(null); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleEdit} isLoading={isLoading}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={!!assignOpen}
        onClose={() => { setAssignOpen(null); setSelectedUser(""); }}
        title="Tugaskan PJ"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Pilih Anggota
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Pilih anggota --</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => { setAssignOpen(null); setSelectedUser(""); }}
            >
              Batal
            </Button>
            <Button onClick={handleAssign} isLoading={isLoading} disabled={!selectedUser}>
              Tugaskan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
