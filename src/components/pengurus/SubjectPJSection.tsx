"use client";

import { useState } from "react";
import { useSubjectPJ } from "@/hooks/useSubjectPJ";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { HiBookOpen, HiPlus, HiTrash, HiUserAdd, HiUser } from "react-icons/hi";
import toast from "react-hot-toast";

interface MemberOption {
  userId: string;
  displayName: string;
}

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
  const { subjects, loading, error, addSubject, assignPJ, deleteSubject } =
    useSubjectPJ(roomId);

  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!subjectName.trim()) return;
    setIsLoading(true);
    try {
      await addSubject(subjectName.trim());
      toast.success("Mata pelajaran ditambahkan!");
      setSubjectName("");
      setAddOpen(false);
    } catch {
      toast.error("Gagal menambah mata pelajaran");
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

  const handleDelete = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Hapus mata pelajaran "${subjectName}"?`)) return;
    try {
      await deleteSubject(subjectId);
      toast.success("Mata pelajaran dihapus!");
    } catch {
      toast.error("Gagal menghapus mata pelajaran");
    }
  };

  if (loading) return <LoadingSpinner message="Memuat PJ..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">
          PJ Mata Pelajaran
        </h3>
        {canManage && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
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
                        <p className="font-medium text-gray-900 truncate">
                          {s.subjectName}
                        </p>
                        {s.userId && member ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <HiUser className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 truncate">
                              {member.displayName}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Belum ada PJ
                          </p>
                        )}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setAssignOpen(s.id);
                            setSelectedUser(s.userId || "");
                          }}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Tugaskan PJ"
                        >
                          <HiUserAdd className="h-4 w-4" />
                        </button>
                        {s.userId && (
                          <button
                            onClick={() => handleUnassign(s.id)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Hapus PJ"
                          >
                            <HiUser className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s.id, s.subjectName)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      <Modal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setSubjectName("");
        }}
        title="Tambah Mata Pelajaran"
      >
        <div className="space-y-4">
          <Input
            label="Nama Mata Pelajaran"
            placeholder="Contoh: Matematika"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setAddOpen(false);
                setSubjectName("");
              }}
            >
              Batal
            </Button>
            <Button onClick={handleAdd} isLoading={isLoading}>
              Tambah
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!assignOpen}
        onClose={() => {
          setAssignOpen(null);
          setSelectedUser("");
        }}
        title="Tugaskan PJ"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pilih Anggota
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
              onClick={() => {
                setAssignOpen(null);
                setSelectedUser("");
              }}
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
