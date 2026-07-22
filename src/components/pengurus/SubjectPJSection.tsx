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
import { MemberOption } from "./types";
import toast from "react-hot-toast";

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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-text-primary">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const member = members.find((m) => m.userId === s.userId);
            return (
              <Card key={s.id}>
                <CardBody>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <HiBookOpen className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {s.subjectName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {s.userId && member ? (
                            <div className="flex items-center gap-1">
                              <HiUser className="h-3 w-3 text-text-muted" />
                              <span className="text-xs text-text-muted truncate">
                                {member.displayName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted">
                              Belum ada PJ
                            </span>
                          )}
                          {s.kkm && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                              KKM: {s.kkm}
                            </span>
                          )}
                          {s.semester && (
                            <span className="text-xs px-1.5 py-0.5 bg-surface-hover text-text-muted rounded">
                              {s.semester}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit mapel"
                        >
                          <HiPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAssignOpen(s.id);
                            setSelectedUser(s.userId || "");
                          }}
                          className="p-1.5 text-text-muted hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Tugaskan PJ"
                        >
                          <HiUserAdd className="h-4 w-4" />
                        </button>
                        {s.userId && (
                          <button
                            onClick={() => handleUnassign(s.id)}
                            className="p-1.5 text-text-muted hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Hapus PJ"
                          >
                            <HiUser className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s.id, s.subjectName)}
                          className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus mapel"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
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
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
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
