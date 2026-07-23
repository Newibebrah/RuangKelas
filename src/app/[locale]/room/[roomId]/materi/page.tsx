"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { useDeployments } from "@/hooks/useDeployments";
import { useSubjects } from "@/hooks/useSubjects";
import { useMaterials } from "@/hooks/useMaterials";
import { MaterialList } from "@/components/class/MaterialList";
import { DeployModal } from "@/components/class/actions/deploy";
import { MaterialModal } from "@/components/class/MaterialModal";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { EmptyState } from "@/components/ui/EmptyState";
import { useLocale } from "@/lib/locale-context";
import { HiArrowLeft, HiPlus, HiBookOpen, HiAcademicCap } from "react-icons/hi";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const SUBJECT_COLORS = [
  "from-pink-100 to-rose-200 dark:from-pink-900/30 dark:to-rose-900/30",
  "from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-900/30",
  "from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-900/30",
  "from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/30",
  "from-violet-100 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30",
  "from-lime-100 to-green-200 dark:from-lime-900/30 dark:to-green-900/30",
  "from-cyan-100 to-indigo-200 dark:from-cyan-900/30 dark:to-indigo-900/30",
  "from-fuchsia-100 to-pink-200 dark:from-fuchsia-900/30 dark:to-pink-900/30",
];

const SUBJECT_EMOJIS: Record<string, string> = {
  matematika: "📐",
  "bahasa indonesia": "📖",
  "bahasa inggris": "🌍",
  ipa: "🔬",
  ips: "🌏",
  ppkn: "⚖️",
  agama: "🕌",
  "seni budaya": "🎨",
  penjaskes: "⚽",
  prakarya: "🛠️",
  informatika: "💻",
};

function getSubjectColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

function getSubjectEmoji(name: string) {
  const key = name.toLowerCase();
  return SUBJECT_EMOJIS[key] || "📚";
}

function formatDate(d: { toDate?: () => Date }) {
  if (!d || typeof d.toDate !== "function") return "";
  return format(d.toDate(), "dd MMM yyyy, HH:mm", { locale: id });
}

function getFileIcon(url: string) {
  const ext = url.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext || "")) return "📝";
  if (["xls", "xlsx"].includes(ext || "")) return "📊";
  if (["ppt", "pptx"].includes(ext || "")) return "📑";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
  return "📎";
}

export default function MateriPage() {
  const { t } = useLocale();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { members } = useRoom();
  const { subjects } = useSubjects(roomId);
  const {
    deployments,
    loading: deplLoading,
    error: deplError,
    deleteDeployment,
  } = useDeployments(roomId);
  const {
    materials,
    loading: matLoading,
    error: matError,
    createMaterial,
    deleteMaterial,
  } = useMaterials(roomId);

  const [deployOpen, setDeployOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const currentMember = members.find((m) => m.userId === user?.id);
  const canDeploy = currentMember?.role === "admin" || currentMember?.role === "guru";
  const canManageMaterial = currentMember?.role === "admin" || currentMember?.role === "guru" || currentMember?.role === "pengurus";
  const isSekretaris = currentMember?.role === "pengurus";

  const subjectMaterials = useMemo(() => {
    if (!selectedSubject) return [];
    return materials.filter((m) => m.subject === selectedSubject);
  }, [materials, selectedSubject]);

  const materialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach((m) => {
      const key = m.subject || "Lainnya";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [materials]);

  const subjectsWithData = useMemo(() => {
    return subjects.map((s) => ({
      name: s.name,
      count: materialCounts[s.name] || 0,
    }));
  }, [subjects, materialCounts]);

  if (deplLoading || matLoading) {
    return <LoadingSpinner size="lg" message={t('common.loadingMateri')} />;
  }

  if (deplError || matError) {
    return <ErrorMessage message={deplError || matError || ""} />;
  }

  return (
    <div className="pb-20">
      {selectedSubject ? (
        <>
          <div className="mb-6">
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => setSelectedSubject(null)}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-3"
            >
              <HiArrowLeft className="h-4 w-4" />
              Kembali ke daftar matkul
            </motion.button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getSubjectEmoji(selectedSubject)}</span>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary font-heading">{selectedSubject}</h1>
                  <p className="text-sm text-text-secondary">
                    {subjectMaterials.length} materi
                  </p>
                </div>
              </div>
              {canManageMaterial && (
                <Button size="sm" onClick={() => setMaterialOpen(true)}>
                  <HiPlus className="h-4 w-4" />
                  Tambah Materi
                </Button>
              )}
            </div>
          </div>

          {subjectMaterials.length === 0 ? (
            <EmptyState
              icon={<HiBookOpen className="h-8 w-8" />}
              title="Belum ada materi"
              description={canManageMaterial ? "Bagikan materi untuk matkul ini" : "Belum ada materi untuk matkul ini"}
            />
          ) : (
            <div className="space-y-3">
              {subjectMaterials.map((m) => (
                <Card key={m.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-text-primary truncate font-heading">
                          {m.title}
                        </h3>
                        {m.description && (
                          <p className="text-sm text-text-muted mt-1 line-clamp-2">
                            {m.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          {m.displayName && <span className="font-medium text-text-secondary">{m.displayName}</span>}
                          <span>{formatDate(m.createdAt)}</span>
                          <span>{m.attachments.length} file(s)</span>
                        </div>
                        {m.attachments.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {m.attachments.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-surface-muted rounded-lg hover:bg-surface-hover transition-colors text-sm text-text-secondary"
                              >
                                <span>{getFileIcon(url)}</span>
                                <span className="truncate flex-1">
                                  {url.split("/").pop()?.replace(/^\d+_/, "") || `File ${i + 1}`}
                                </span>
                                <span className="text-xs text-text-muted">↗</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {canManageMaterial && (
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={async () => {
                            if (confirm(`Hapus materi "${m.title}"?`)) {
                              try {
                                await deleteMaterial(m);
                                toast.success("Materi berhasil dihapus");
                              } catch {
                                toast.error("Gagal menghapus materi");
                              }
                            }
                          }}
                          className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </motion.button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/20">
                  <HiBookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary font-heading">{t('nav.materi')}</h1>
                  <p className="text-sm text-text-secondary mt-1">
                    {t('materi.desc')}
                  </p>
                </div>
              </div>
            </div>
            {canDeploy && (
              <Button onClick={() => setDeployOpen(true)}>
                <HiPlus className="h-4 w-4" />
                {t('materi.share')}
              </Button>
            )}
          </div>

          {subjects.length > 0 && (
            <section className="mb-8">
              <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2 font-heading">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                Materi Pelajaran
              </h3>
              {subjects.length === 0 ? (
                <EmptyState
                  icon={<HiBookOpen className="h-10 w-10" />}
                  title="Belum ada jadwal matkul"
                  description="Atur jadwal matkul di halaman Jadwal"
                />
              ) : (
                <motion.div
                  className="grid gap-4 grid-cols-2 lg:grid-cols-3"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06 } },
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {subjectsWithData.map((subject) => (
                    <motion.button
                      key={subject.name}
                      variants={{
                        hidden: { opacity: 0, y: 16, scale: 0.97 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
                      }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSubject(subject.name)}
                      className="text-left"
                    >
                      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
                        <div className={`bg-gradient-to-br ${getSubjectColor(subject.name)} px-5 pt-5 pb-4`}>
                          <span className="text-3xl" role="img" aria-label={subject.name}>
                            {getSubjectEmoji(subject.name)}
                          </span>
                          <h4 className="font-bold text-text-primary mt-3 text-sm leading-tight font-heading">
                            {subject.name}
                          </h4>
                        </div>
                        <CardBody className="!px-5 !py-3">
                          <div className="flex items-center gap-2">
                            <HiAcademicCap className="h-4 w-4 text-text-muted" />
                            <span className="text-sm text-text-secondary font-medium">
                              {subject.count} materi
                            </span>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </section>
          )}

          <section>
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2 font-heading">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Pengumuman &amp; Materi Umum
            </h3>
            <MaterialList
              deployments={deployments}
              canManage={canDeploy}
              onDelete={deleteDeployment}
            />
          </section>
        </>
      )}

      <DeployModal
        isOpen={deployOpen}
        onClose={() => setDeployOpen(false)}
        roomId={roomId}
        subjects={subjects.map((s) => s.name)}
      />

      <MaterialModal
        isOpen={materialOpen}
        onClose={() => {
          setMaterialOpen(false);
        }}
        subjects={subjects.map((s) => s.name)}
        initialSubject={selectedSubject || undefined}
        onSubmit={async (data) => {
          await createMaterial(data);
        }}
      />
    </div>
  );
}
