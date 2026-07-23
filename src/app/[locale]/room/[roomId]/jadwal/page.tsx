"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSubjects } from "@/hooks/useSubjects";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  HiPlus, HiTrash, HiPencil, HiAcademicCap, HiClock, HiUser,
} from "react-icons/hi";
import { useLocale } from "@/lib/locale-context";
import toast from "react-hot-toast";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const DAY_COLORS: Record<string, string> = {
  Senin: "border-l-indigo-400",
  Selasa: "border-l-emerald-400",
  Rabu: "border-l-amber-400",
  Kamis: "border-l-rose-400",
  Jumat: "border-l-cyan-400",
  Sabtu: "border-l-purple-400",
};

const SUBJECT_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981",
  "#8B5CF6", "#F97316", "#06B6D4", "#EF4444",
  "#3B82F6", "#84CC16", "#D946EF", "#14B8A6",
];

export default function JadwalPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { subjects, loading, addSubject, updateSubject, deleteSubject } = useSubjects(roomId);
  const { isAdmin, isKetua, isSekretaris } = useRoleAccess(roomId);
  const canManage = isAdmin || isKetua || isSekretaris;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [day, setDay] = useState("Senin");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:30");
  const [teacher, setTeacher] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setDay("Senin");
    setStartTime("07:00");
    setEndTime("08:30");
    setTeacher("");
    setShowModal(true);
  };

  const openEdit = (s: typeof subjects[0]) => {
    setEditing(s.id);
    setName(s.name);
    setDay(s.day);
    setStartTime(s.startTime);
    setEndTime(s.endTime);
    setTeacher(s.teacher || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Nama matkul harus diisi"); return; }
    if (!startTime || !endTime) { toast.error("Jam harus diisi"); return; }
    setSaving(true);
    try {
      const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
      if (editing) {
        await updateSubject(editing, { name: name.trim(), day, startTime, endTime, teacher: teacher.trim() || undefined, color });
      } else {
        await addSubject({ name: name.trim(), day, startTime, endTime, teacher: teacher.trim() || undefined, color });
      }
      setShowModal(false);
      toast.success(editing ? "Matkul diupdate" : "Matkul ditambahkan");
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`Hapus mata kuliah "${name}"? Semua tugas, materi, dan PJ terkait akan ikut terhapus.`)) return;
    try {
      await deleteSubject(id, name);
      toast.success("Matkul dihapus");
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const grouped = DAYS.map((d) => ({
    day: d,
    items: subjects.filter((s) => s.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Jadwal Mata Kuliah</h2>
          <p className="text-sm text-text-secondary mt-1">Atur jadwal matkul kelas</p>
        </div>
        {canManage && (
          <Button onClick={openAdd}>
            <HiPlus className="h-4 w-4" />
            Tambah Matkul
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-surface-muted rounded-2xl" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center mb-4">
            <HiAcademicCap className="h-8 w-8 text-text-muted" />
          </div>
          <p className="text-text-primary font-semibold">Belum ada jadwal matkul</p>
          <p className="text-sm text-text-secondary mt-1">Tambahkan matkul untuk mulai</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {grouped.map(({ day: dayName, items }) =>
            items.length === 0 ? null : (
              <div key={dayName}>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  {dayName}
                </h3>
                <div className="space-y-2">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-border/50 border-l-4 ${DAY_COLORS[dayName] || "border-l-indigo-400"} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-primary truncate">{s.name}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <HiClock className="h-3 w-3" />
                              {s.startTime} – {s.endTime}
                            </span>
                            {s.teacher && (
                              <span className="flex items-center gap-1">
                                <HiUser className="h-3 w-3" />
                                {s.teacher}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                            >
                              <HiPencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.name)}
                              className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            >
                              <HiTrash className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Matkul" : "Tambah Matkul"}
        size="md"
      >
        <div className="space-y-4">
          <Input label="Nama Mata Kuliah" placeholder="Contoh: Matematika Wajib" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Hari</label>
            <select
              className="w-full px-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jam Mulai" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input label="Jam Selesai" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <Input label="Pengajar (opsional)" placeholder="Nama guru" value={teacher} onChange={(e) => setTeacher(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSave} isLoading={saving}>{editing ? "Simpan" : "Tambah"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
