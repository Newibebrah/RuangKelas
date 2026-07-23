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
    <svg viewBox="0 0 220 160" className="w-full h-auto max-w-[260px]" fill="none">
      <motion.rect
        x="25" y="25" width="75" height="55" rx="12"
        className="fill-indigo-500/20 dark:fill-indigo-400/20"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <rect x="36" y="36" width="18" height="14" rx="4" className="fill-indigo-400/60 dark:fill-indigo-300/60" />
      <rect x="60" y="36" width="18" height="14" rx="4" className="fill-indigo-300/50 dark:fill-indigo-400/50" />
      <rect x="36" y="54" width="14" height="10" rx="3" className="fill-amber-400/70" />
      <rect x="54" y="54" width="14" height="10" rx="3" className="fill-emerald-400/70" />
      <rect x="72" y="54" width="14" height="10" rx="3" className="fill-rose-400/70" />
      <motion.rect
        x="115" y="40" width="85" height="50" rx="12"
        className="fill-emerald-500/20 dark:fill-emerald-400/20"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <rect x="126" y="53" width="22" height="12" rx="4" className="fill-emerald-400/60" />
      <rect x="154" y="53" width="22" height="12" rx="4" className="fill-emerald-300/50" />
      <rect x="126" y="69" width="20" height="10" rx="3" className="fill-indigo-400/60" />
      <rect x="152" y="69" width="20" height="10" rx="3" className="fill-amber-400/60" />
      {/* Decorative floating dots */}
      <motion.circle cx="60" cy="100" r="6" className="fill-indigo-400/50" animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      <motion.circle cx="90" cy="95" r="5" className="fill-emerald-400/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} />
      <motion.circle cx="160" cy="105" r="6" className="fill-amber-400/50" animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} />
      {/* Wavy line */}
      <motion.path
        d="M20 125 Q65 108 110 125 Q155 142 200 125"
        stroke="url(#waveGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none"
        animate={{ d: ["M20 125 Q65 108 110 125 Q155 142 200 125", "M20 128 Q65 145 110 128 Q155 108 200 128"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>
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
        color: "text-indigo-500",
      });
    }
    return items.slice(0, 5);
  }, [rooms]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Premium background */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 dark:from-indigo-950/30 dark:via-transparent dark:to-purple-950/30" />
          <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <AppHeader
          left={
            <div className="flex items-center gap-2.5">
              <div className={`${isMobile ? "w-8 h-8" : "w-9 h-9"} rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/30`}>
                <HiAcademicCap className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white`} />
              </div>
              {!isMobile && (
                <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
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
            <motion.div variants={itemVariants} className={`${isMobile ? "flex flex-col items-center text-center gap-4 mb-8" : "flex items-center justify-between gap-12 mb-14"}`}>
              <div className={isMobile ? "" : "flex-1 max-w-xl"}>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-5 ring-1 ring-indigo-200/50 dark:ring-indigo-700/50 shadow-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  {greeting}
                </motion.div>
                <h1 className={`${isMobile ? "text-3xl" : "text-5xl sm:text-6xl"} font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]`}>
                  Halo,{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {user?.displayName || "Pengguna"}
                  </span>
                  !
                </h1>
                <p className={`text-slate-500 dark:text-slate-400 mt-3 ${isMobile ? "text-sm" : "text-lg"}`}>
                  {t("dashboard.subtitle")}
                </p>
                <div className={`flex gap-3 ${isMobile ? "justify-center mt-6" : "mt-7"}`}>
                  <Button
                    size={isMobile ? "md" : "lg"}
                    onClick={() => setShowCreateModal(true)}
                    className="shadow-lg shadow-indigo-500/25"
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
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                  className="shrink-0"
                >
                  <div className="relative">
                    <div className="absolute -inset-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
                    <HeroIllustration />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {isMobile && (
              <motion.div variants={itemVariants} className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-2xl" />
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
                    <div className="h-16 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/50 animate-pulse shadow-sm" />
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
                  <div className={`flex items-center gap-3 ${isMobile ? "mb-4" : "mb-6"}`}>
                    <div className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
                      <HiAcademicCap className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white`} />
                    </div>
                    <h2 className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-slate-900 dark:text-white flex-1`}>
                      {t("nav.myClasses")}
                    </h2>
                    <span className="inline-flex items-center justify-center min-w-[1.8rem] h-7 px-2.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold ring-1 ring-indigo-200/50 dark:ring-indigo-700/50">
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
                <div className={`relative ${isMobile ? "my-8" : "my-14"}`}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700/50" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-50 dark:bg-slate-950 px-4 rounded-full">
                      <HiSparkles className="h-5 w-5 text-slate-400" />
                    </span>
                  </div>
                </div>

                {/* ───── Activity Feed ───── */}
                <motion.div variants={itemVariants}>
                  <div className={`flex items-center gap-2 ${isMobile ? "mb-4" : "mb-6"}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                      <HiLightningBolt className={`${isMobile ? "h-4 w-4" : "h-4 w-4"} text-white`} />
                    </div>
                    <h2 className={`${isMobile ? "text-lg" : "text-2xl"} font-bold text-slate-900 dark:text-white`}>
                      Aktivitas Terbaru
                    </h2>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/40 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden">
                    {activities.length > 0 ? (
                      <div className={`divide-y divide-slate-100 dark:divide-slate-700/30 ${isMobile ? "text-sm" : ""}`}>
                        {activities.map((act, i) => (
                          <motion.div
                            key={act.id}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-start gap-3 ${isMobile ? "px-4 py-3" : "px-5 py-4"} hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors`}
                          >
                            <div className={`mt-0.5 ${act.color}`}>{act.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 dark:text-slate-300 font-medium">{act.text}</p>
                              {act.time && (
                                <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center py-8 text-slate-400 ${isMobile ? "text-sm" : ""}`}>
                        <HiSparkles className="h-8 w-8 mb-2" />
                        <p>Belum ada aktivitas.</p>
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
