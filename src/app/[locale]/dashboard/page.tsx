"use client";

import { useState } from "react";
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
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useLocale } from "@/lib/locale-context";
import {
  HiAcademicCap,
  HiPlus,
  HiLogin,
  HiUsers,
  HiBookOpen,
  HiSparkles,
} from "react-icons/hi";

function StatCard({
  icon,
  gradient,
  label,
  value,
}: {
  icon: React.ReactNode;
  gradient: string;
  label: string;
  value: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-surface rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 ring-1 ring-black/[0.02]`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-text-primary tracking-tight">
        {value}
      </p>
      <p className="text-sm text-text-secondary mt-0.5">{label}</p>
    </motion.div>
  );
}

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

export default function DashboardPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { rooms, loading, error } = useRoom();
  const { isMobile } = useMobile();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const totalMembers = rooms.reduce(
    (sum, room) =>
      sum + ((room as any).memberIds?.length || 0),
    0
  );

  const activeRooms = rooms.filter(
    (r) => (r as any).isActive !== false
  ).length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-muted">
        <AppHeader
          left={
            <div className="flex items-center gap-2.5">
              <div className={`${isMobile ? "w-8 h-8" : "w-9 h-9"} rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20`}>
                <HiAcademicCap className={`${isMobile ? "h-4 w-4" : "h-5 w-5"} text-white`} />
              </div>
              {!isMobile && (
                <span className="text-xl font-bold tracking-tight text-text-primary">
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
            {/* Greeting */}
            <motion.div variants={itemVariants} className={isMobile ? "mb-5" : "mb-10"}>
              <div className="flex items-center gap-2.5">
                <h1 className={`${isMobile ? "text-xl" : "text-3xl sm:text-4xl"} font-bold text-text-primary tracking-tight`}>
                  Halo, {user?.displayName || "Pengguna"}!
                </h1>
                <span className={`inline-block ${isMobile ? "text-xl" : "text-3xl sm:text-4xl"}`}>
                  👋
                </span>
              </div>
              <p className={`text-text-secondary mt-1 ${isMobile ? "text-sm" : "text-lg"}`}>
                {t("dashboard.subtitle")}
              </p>
            </motion.div>

            {loading ? (
              isMobile ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-surface rounded-xl border border-border animate-pulse" />
                  ))}
                </div>
              ) : (
                <LoadingSkeleton variant="card" count={6} />
              )
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
                {/* Stats */}
                <motion.div
                  variants={itemVariants}
                  className={isMobile ? "flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none" : "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"}
                >
                  {isMobile ? (
                    <>
                      {[
                        { icon: <HiAcademicCap className="h-4 w-4 text-indigo-600" />, gradient: "from-indigo-500/10 to-indigo-600/5", label: "Total Kelas", value: rooms.length },
                        { icon: <HiUsers className="h-4 w-4 text-emerald-600" />, gradient: "from-emerald-500/10 to-emerald-600/5", label: "Total Anggota", value: totalMembers },
                        { icon: <HiBookOpen className="h-4 w-4 text-amber-600" />, gradient: "from-amber-500/10 to-amber-600/5", label: "Kelas Aktif", value: activeRooms },
                      ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-border min-w-[140px] shrink-0">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                            {stat.icon}
                          </div>
                          <div>
                            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                            <p className="text-xs text-text-secondary">{stat.label}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <StatCard icon={<HiAcademicCap className="h-5 w-5 text-indigo-600" />} gradient="from-indigo-500/10 to-indigo-600/5" label="Total Kelas" value={rooms.length} />
                      <StatCard icon={<HiUsers className="h-5 w-5 text-emerald-600" />} gradient="from-emerald-500/10 to-emerald-600/5" label="Total Anggota" value={totalMembers} />
                      <StatCard icon={<HiBookOpen className="h-5 w-5 text-amber-600" />} gradient="from-amber-500/10 to-amber-600/5" label="Kelas Aktif" value={activeRooms} />
                    </>
                  )}
                </motion.div>

                {/* Room List */}
                <motion.div
                  variants={itemVariants}
                  className={isMobile ? "space-y-2" : "grid gap-5 sm:grid-cols-2"}
                >
                  {rooms.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
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
