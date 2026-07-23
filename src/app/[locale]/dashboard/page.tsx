"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { useMobile } from "@/lib/mobile-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UserMenu } from "@/components/auth/UserMenu";
import { AppHeader } from "@/components/ui/AppHeader";
import { RoomCard } from "@/components/room/RoomCard";
import { CreateRoomModal } from "@/components/room/CreateRoomModal";
import { JoinRoomModal } from "@/components/room/JoinRoomModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useLocale } from "@/lib/locale-context";
import {
  HiAcademicCap, HiPlus, HiLogin, HiUsers, HiClipboardCopy,
  HiCalendar, HiFlag, HiSparkles, HiLightningBolt, HiCheck,
} from "react-icons/hi";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

function HeroIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-full h-auto max-w-[220px]" fill="none">
      <rect x="20" y="20" width="70" height="50" rx="10" className="fill-primary-100 dark:fill-primary-900/40" />
      <rect x="30" y="30" width="18" height="12" rx="3" className="fill-primary-300 dark:fill-primary-600" />
      <rect x="54" y="30" width="18" height="12" rx="3" className="fill-primary-200 dark:fill-primary-500/60" />
      <rect x="30" y="46" width="12" height="8" rx="2" className="fill-amber-300 dark:fill-amber-500/60" />
      <rect x="46" y="46" width="12" height="8" rx="2" className="fill-emerald-300 dark:fill-emerald-500/60" />
      <rect x="62" y="46" width="12" height="8" rx="2" className="fill-rose-300 dark:fill-rose-500/60" />
      <motion.rect
        x="105" y="35" width="75" height="45" rx="10"
        className="fill-emerald-100 dark:fill-emerald-900/40"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <rect x="115" y="47" width="20" height="10" rx="3" className="fill-emerald-300 dark:fill-emerald-500/60" />
      <rect x="140" y="47" width="20" height="10" rx="3" className="fill-emerald-200 dark:fill-emerald-500/40" />
      <rect x="115" y="62" width="18" height="8" rx="2" className="fill-primary-300 dark:fill-primary-500/50" />
      <rect x="137" y="62" width="18" height="8" rx="2" className="fill-amber-300 dark:fill-amber-500/50" />
      <circle cx="55" cy="85" r="5" className="fill-primary-400 dark:fill-primary-500" />
      <circle cx="80" cy="80" r="4" className="fill-emerald-400 dark:fill-emerald-500" />
      <circle cx="145" cy="90" r="5" className="fill-amber-400 dark:fill-amber-500" />
      <motion.path
        d="M20 110 Q60 95 100 110 Q140 125 180 110"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="stroke-primary-300 dark:stroke-primary-600/50"
        fill="none"
        animate={{ d: ["M20 110 Q60 95 100 110 Q140 125 180 110", "M20 112 Q60 125 100 112 Q140 95 180 112"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx="30" cy="15" r="3" className="fill-amber-300 dark:fill-amber-500/50" />
      <circle cx="170" cy="18" r="2.5" className="fill-primary-300 dark:fill-primary-500/50" />
      <circle cx="110" cy="10" r="2" className="fill-emerald-300 dark:fill-emerald-500/50" />
    </svg>
  );
}

export default function DashboardPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { rooms, loading, error } = useRoom();
  const { isMobile } = useMobile();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 19) return "Selamat sore";
    return "Selamat malam";
  }, []);

  const activities = useMemo(() => {
    if (rooms.length === 0) return [];
    const items: { id: string; text: string; time: string; icon: React.ReactNode; color: string }[] = [];
    rooms.forEach((room) => {
      const r = room as any;
      if (r.description) {
        items.push({
          id: `desc-${r.id}`,
          text: `"${r.description.slice(0, 60)}${r.description.length > 60 ? "…" : ""}"`,
          time: "baru saja",
          icon: <HiLightningBolt className="h-3.5 w-3.5" />,
          color: "text-amber-500",
        });
      }
    });
    if (items.length === 0) {
      items.push({
        id: "welcome",
        text: "Semua ruang kelas siap digunakan. Ayo mulai aktivitas!",
        time: "",
        icon: <HiSparkles className="h-3.5 w-3.5" />,
        color: "text-primary-500",
      });
    }
    return items.slice(0, 5);
  }, [rooms]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-muted relative overflow-hidden">
        {/* Background decorations */}
        <div className="fixed inset-0 pointer-events-none -z-10 dot-pattern opacity-[0.3]" />
        <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-500/3 dark:bg-primary-500/5 blur-3xl pointer-events-none -z-10" />
        <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-emerald-500/3 dark:bg-emerald-500/5 blur-3xl pointer-events-none -z-10" />

        <AppHeader
          left={
            <div className="flex items-center gap-2.5">
              <div className={`${isMobile ? "w-8 h-8" : "w-9 h-9"} rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20`}>
                <HiAcademicCap className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white`} />
              </div>
              {!isMobile && (
                <span className="text-xl font-bold tracking-tight text-text-primary font-heading">
                  {t("app.name")}
                </span>
              )}
            </div>
          }
          right={
            <div className="flex items-center gap-2">
              {!isMobile ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowJoinModal(true)}>
                    <HiLogin className="h-4 w-4" />
                    {t("action.join")}
                  </Button>
                  <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    <HiPlus className="h-4 w-4" />
                    {t("action.createClass")}
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={() => setShowCreateModal(true)} className="!px-3 !text-xs">
                    <HiPlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowJoinModal(true)} className="!px-3 !text-xs">
                    <HiLogin className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <UserMenu />
            </div>
          }
        />

        <main className={`max-w-7xl mx-auto ${isMobile ? "px-3 py-4" : "px-4 sm:px-6 lg:px-8 py-8"}`}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* ───── Hero ───── */}
            <motion.div variants={itemVariants} className={`${isMobile ? "flex flex-col items-center text-center gap-4 mb-6" : "flex items-center justify-between gap-10 mb-12"}`}>
              <div className={isMobile ? "" : "flex-1 max-w-lg"}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold mb-4 ring-1 ring-primary-200/50 dark:ring-primary-700/30">
                  <HiSparkles className="h-3 w-3" />
                  {greeting}
                </div>
                <h1 className={`${isMobile ? "text-2xl" : "text-4xl sm:text-5xl"} font-bold text-text-primary tracking-tight leading-tight font-heading`}>
                  Halo, <span className="bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">{user?.displayName || "Pengguna"}</span>!
                </h1>
                <p className={`text-text-secondary mt-2 ${isMobile ? "text-sm" : "text-lg"}`}>
                  {t("dashboard.subtitle")}
                </p>
                <div className={`flex gap-3 ${isMobile ? "justify-center mt-5" : "mt-6"}`}>
                  <Button
                    size={isMobile ? "md" : "lg"}
                    onClick={() => setShowCreateModal(true)}
                    className="shadow-lg shadow-primary-500/20"
                  >
                    <HiPlus className="h-4 w-4" />
                    {t("action.createClass")}
                  </Button>
                  <Button
                    variant="outline"
                    size={isMobile ? "md" : "lg"}
                    onClick={() => setShowJoinModal(true)}
                  >
                    <HiLogin className="h-4 w-4" />
                    {t("action.join")}
                  </Button>
                </div>
              </div>
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="shrink-0"
                >
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-2xl" />
                    <HeroIllustration />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {isMobile && (
              <motion.div variants={itemVariants} className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-2xl" />
                  <HeroIllustration />
                </div>
              </motion.div>
            )}

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="h-16 bg-surface rounded-xl border border-border/60 animate-pulse shadow-sm" />
                  </motion.div>
                ))}
              </div>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : rooms.length === 0 ? (
              <motion.div variants={itemVariants}>
                <EmptyState
                  icon={
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  }
                  title={t("common.emptyClass")}
                  description={t("dashboard.emptyDesc")}
                  action={
                    <div className={`flex gap-3 ${isMobile ? "flex-col" : ""}`}>
                      <Button className={isMobile ? "w-full" : ""} onClick={() => setShowCreateModal(true)}>
                        <HiPlus className="h-4 w-4" />
                        {t("action.createClass")}
                      </Button>
                      <Button variant="outline" className={isMobile ? "w-full" : ""} onClick={() => setShowJoinModal(true)}>
                        <HiLogin className="h-4 w-4" />
                        {t("action.joinClass")}
                      </Button>
                    </div>
                  }
                />
              </motion.div>
            ) : (
              <>
                {/* ───── Room List ───── */}
                <motion.div variants={itemVariants}>
                  <div className={`flex items-center gap-2 ${isMobile ? "mb-3" : "mb-5"}`}>
                    <div className={`${isMobile ? "w-7 h-7" : "w-8 h-8"} rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-sm shadow-primary-500/20`}>
                      <HiAcademicCap className={`${isMobile ? "h-3.5 w-3.5" : "h-4 w-4"} text-white`} />
                    </div>
                    <h2 className={`${isMobile ? "text-base" : "text-xl"} font-bold text-text-primary font-heading flex-1`}>
                      {t("nav.myClasses")}
                    </h2>
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold ring-1 ring-primary-200/50 dark:ring-primary-700/30">
                      {rooms.length}
                    </span>
                  </div>
                  <div className={isMobile ? "space-y-2" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
                    {rooms.map((room, i) => (
                      <motion.div
                        key={room.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
                      >
                        <RoomCard room={room} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* ───── Divider ───── */}
                <div className={`relative ${isMobile ? "my-6" : "my-12"}`}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-surface-muted px-3 rounded-full">
                      <HiSparkles className="h-4 w-4 text-text-muted" />
                    </span>
                  </div>
                </div>

                {/* ───── Activity Feed ───── */}
                <motion.div variants={itemVariants}>
                  <div className={`flex items-center gap-2 ${isMobile ? "mb-3" : "mb-5"}`}>
                    <HiLightningBolt className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-amber-500`} />
                    <h2 className={`${isMobile ? "text-base" : "text-xl"} font-bold text-text-primary font-heading`}>
                      Aktivitas Terbaru
                    </h2>
                  </div>
                  <div className="bg-surface/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                    {activities.length > 0 ? (
                      <div className={`divide-y divide-border-light ${isMobile ? "text-sm" : ""}`}>
                        {activities.map((act, i) => (
                          <motion.div
                            key={act.id}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-start gap-3 ${isMobile ? "px-3 py-2.5" : "px-5 py-3.5"} hover:bg-surface-hover/50 transition-colors`}
                          >
                            <div className={`mt-0.5 ${act.color}`}>{act.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-text-primary">{act.text}</p>
                              {act.time && (
                                <p className="text-xs text-text-muted mt-0.5">{act.time}</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center py-8 text-text-muted ${isMobile ? "text-sm" : ""}`}>
                        <HiSparkles className="h-8 w-8 mb-2" />
                        <p>Belum ada aktivitas. Mulai dengan membuat atau bergabung ke ruang kelas!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </main>

        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
        <JoinRoomModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
        />
      </div>
    </AuthGuard>
  );
}
