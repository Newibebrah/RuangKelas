"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import toast from "react-hot-toast";
import { HiTrash, HiRefresh, HiCog, HiSparkles } from "react-icons/hi";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function fmtDate(ts: Timestamp | undefined) {
  if (!ts || typeof ts.toDate !== "function") return "-";
  return format(ts.toDate(), "dd MMM yyyy, HH:mm", { locale: localeId });
}

function fmtStr(v: unknown) {
  if (v === null || v === undefined) return "-";
  return String(v);
}

function useSnapshotCollection(collectionName: string, field: string, value: string) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    setLoading(true);
    setError(null);

    const q = query(collection(db, collectionName), where(field, "==", value));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setError("Gagal memuat data");
        setLoading(false);
      }
    );
    return unsub;
  }, [collectionName, field, value]);

  return { data, loading, error };
}

function Section({
  title,
  data,
  loading,
  error,
  onDelete,
  columns,
}: {
  title: string;
  data: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  onDelete: (id: string) => Promise<void>;
  columns: { key: string; label: string; fmt?: (v: unknown) => string }[];
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h3 className="font-semibold text-text-primary">{title} ({data.length})</h3>
      </div>
      {loading ? (
        <div className="p-8"><LoadingSpinner size="sm" /></div>
      ) : error ? (
        <div className="p-4"><ErrorMessage message={error} /></div>
      ) : data.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">Tidak ada data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-text-muted text-xs uppercase tracking-wider">
                {columns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3 font-medium whitespace-nowrap">{c.label}</th>
                ))}
                <th className="text-right px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={String(item.id)} className="border-b border-border/30 last:border-0 hover:bg-surface-hover/50 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-text-primary truncate max-w-[200px]">
                      {c.fmt ? c.fmt(item[c.key]) : fmtStr(item[c.key])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={deleting === String(item.id)}
                      onClick={async () => {
                        if (!confirm("Hapus item ini?")) return;
                        setDeleting(String(item.id));
                        try {
                          await onDelete(String(item.id));
                          toast.success("Berhasil dihapus");
                        } catch {
                          toast.error("Gagal menghapus");
                        } finally {
                          setDeleting(null);
                        }
                      }}
                      className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors disabled:opacity-50"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function KelolaDataPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";

  const subjects = useSnapshotCollection("subjects", "roomId", roomId);
  const assignments = useSnapshotCollection("tugas", "roomId", roomId);
  const materials = useSnapshotCollection("materials", "roomId", roomId);
  const deployments = useSnapshotCollection("deployments", "roomId", roomId);

  const deleteDocById = (coll: string) => async (id: string) => {
    await deleteDoc(doc(db, coll, id));
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <HiCog className="h-12 w-12 text-text-muted mb-4" />
        <p className="text-text-primary font-semibold">Akses ditolak</p>
        <p className="text-sm text-text-secondary mt-1">Halaman ini khusus untuk admin</p>
      </div>
    );
  }

  const cleanOrphaned = async () => {
    if (!confirm("Hapus semua tugas, materi, dan PJ yang matkulnya sudah tidak ada di jadwal?")) return;
    const subjectNames = new Set(subjects.data.map((s) => String(s.name)));
    let count = 0;

    const deleteMatching = async (coll: string, field: string) => {
      const snap = await getDocs(
        query(collection(db, coll), where("roomId", "==", roomId))
      );
      for (const d of snap.docs) {
        const val = String(d.data()[field] || "");
        if (val && !subjectNames.has(val)) {
          await deleteDoc(d.ref);
          count++;
        }
      }
    };

    try {
      await deleteMatching("tugas", "subject");
      await deleteMatching("materials", "subject");
      await deleteMatching("subjectPJ", "subjectName");
      toast.success(`${count} data yatim berhasil dihapus`);
    } catch {
      toast.error("Gagal membersihkan data");
    }
  };

  return (
    <div className="pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary font-heading">Kelola Data</h2>
          <p className="text-sm text-text-secondary mt-1">Manajemen semua data kelas (khusus admin)</p>
        </div>
        <button
          onClick={cleanOrphaned}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-danger bg-danger-light/50 hover:bg-danger-light rounded-xl transition-colors"
        >
          <HiSparkles className="h-4 w-4" />
          Bersihkan Data Yatim
        </button>
      </div>

      <Section
        title="Mata Kuliah (subjects)"
        data={subjects.data}
        loading={subjects.loading}
        error={subjects.error}
        onDelete={deleteDocById("subjects")}
        columns={[
          { key: "name", label: "Nama" },
          { key: "day", label: "Hari" },
          { key: "startTime", label: "Jam Mulai" },
          { key: "endTime", label: "Jam Selesai" },
        ]}
      />

      <Section
        title="Tugas (tugas)"
        data={assignments.data}
        loading={assignments.loading}
        error={assignments.error}
        onDelete={deleteDocById("tugas")}
        columns={[
          { key: "subject", label: "Matkul" },
          { key: "description", label: "Deskripsi", fmt: (v: unknown) => fmtStr(v).slice(0, 60) },
          { key: "createdAt", label: "Dibuat", fmt: (v: unknown) => fmtDate(v as Timestamp) },
        ]}
      />

      <Section
        title="Materi (materials)"
        data={materials.data}
        loading={materials.loading}
        error={materials.error}
        onDelete={deleteDocById("materials")}
        columns={[
          { key: "title", label: "Judul" },
          { key: "subject", label: "Matkul" },
          { key: "createdAt", label: "Dibuat", fmt: (v: unknown) => fmtDate(v as Timestamp) },
        ]}
      />

      <Section
        title="Pengumuman (deployments)"
        data={deployments.data}
        loading={deployments.loading}
        error={deployments.error}
        onDelete={deleteDocById("deployments")}
        columns={[
          { key: "title", label: "Judul" },
          { key: "subject", label: "Matkul" },
          { key: "createdAt", label: "Dibuat", fmt: (v: unknown) => fmtDate(v as Timestamp) },
        ]}
      />
    </div>
  );
}
