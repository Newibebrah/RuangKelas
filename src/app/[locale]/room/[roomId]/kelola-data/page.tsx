"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import toast from "react-hot-toast";
import { HiTrash, HiRefresh, HiCog } from "react-icons/hi";
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

interface TableProps {
  title: string;
  data: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDelete: (id: string) => Promise<void>;
  columns: { key: string; label: string; fmt?: (v: unknown) => string }[];
}

function DataTable({ title, data, loading, error, onRefresh, onDelete, columns }: TableProps) {
  return (
    <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h3 className="font-semibold text-text-primary">{title} ({data.length})</h3>
        <button onClick={onRefresh} className="p-1.5 text-text-muted hover:text-primary-600 rounded-lg transition-colors" title="Refresh">
          <HiRefresh className="h-4 w-4" />
        </button>
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
                      onClick={async () => {
                        if (confirm(`Hapus item ini?`)) {
                          try {
                            await onDelete(String(item.id));
                            toast.success("Berhasil dihapus");
                            onRefresh();
                          } catch { toast.error("Gagal menghapus"); }
                        }
                      }}
                      className="p-1.5 text-text-muted hover:text-danger rounded-lg transition-colors"
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

function useCollection(collectionName: string, roomField: string, roomValue: string) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!roomValue) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, collectionName), where(roomField, "==", roomValue));
      const snap = await getDocs(q);
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [collectionName, roomField, roomValue]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deleteItem = useCallback(async (id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  }, [collectionName]);

  return { data, loading, error, refresh: fetchData, deleteItem };
}

export default function KelolaDataPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();

  const currentMember = members.find((m) => m.userId === user?.id);
  const isAdmin = currentMember?.role === "admin";

  const subjects = useCollection("subjects", "roomId", roomId);
  const assignments = useCollection("assignments", "roomId", roomId);
  const materials = useCollection("materials", "roomId", roomId);
  const deployments = useCollection("deployments", "roomId", roomId);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <HiCog className="h-12 w-12 text-text-muted mb-4" />
        <p className="text-text-primary font-semibold">Akses ditolak</p>
        <p className="text-sm text-text-secondary mt-1">Halaman ini khusus untuk admin</p>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary">Kelola Data</h2>
        <p className="text-sm text-text-secondary mt-1">Manajemen semua data kelas (khusus admin)</p>
      </div>

      {[
        { coll: subjects, title: "Mata Kuliah (subjects)", cols: [
          { key: "name", label: "Nama" },
          { key: "day", label: "Hari" },
          { key: "startTime", label: "Jam Mulai" },
          { key: "endTime", label: "Jam Selesai" },
        ]},
        { coll: assignments, title: "Tugas (assignments)", cols: [
          { key: "subject", label: "Matkul" },
          { key: "description", label: "Deskripsi", fmt: (v: unknown) => fmtStr(v).slice(0, 60) },
          { key: "createdAt", label: "Dibuat", fmt: (v: unknown) => fmtDate(v as Timestamp) },
        ]},
        { coll: materials, title: "Materi (materials)", cols: [
          { key: "title", label: "Judul" },
          { key: "subject", label: "Matkul" },
          { key: "createdAt", label: "Dibuat", fmt: (v: unknown) => fmtDate(v as Timestamp) },
        ]},
        { coll: deployments, title: "Pengumuman (deployments)", cols: [
          { key: "title", label: "Judul" },
          { key: "subject", label: "Matkul" },
          { key: "createdAt", label: "Dibuat", fmt: (v: unknown) => fmtDate(v as Timestamp) },
        ]},
      ].map(({ coll, title, cols }) => (
        <DataTable
          key={title}
          title={title}
          data={coll.data}
          loading={coll.loading}
          error={coll.error}
          onRefresh={coll.refresh}
          onDelete={coll.deleteItem}
          columns={cols}
        />
      ))}
    </div>
  );
}
