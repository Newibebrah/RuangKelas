"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <HiAcademicCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">
                {t("app.name")}
              </span>
            </div>
          }
          right={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowJoinModal(true)}
              >
                <HiLogin className="h-4 w-4" />
                {t("action.join")}
              </Button>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <HiPlus className="h-4 w-4" />
                {t("action.createClass")}
              </Button>
              <UserMenu />
            </div>
          }
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Greeting */}
            <motion.div variants={itemVariants} className="mb-10">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                  Halo, {user?.displayName || "Pengguna"}!
                </h1>
                <motion.span
                  className="inline-block text-3xl sm:text-4xl origin-bottom-right"
                  animate={{ rotate: [0, -10, 12, -8, 10, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                >
                  👋
                </motion.span>
              </div>
              <p className="text-lg text-text-secondary mt-2">
                {t("dashboard.subtitle")}
              </p>
            </motion.div>

            {loading ? (
              <LoadingSkeleton variant="card" count={6} />
            ) : error ? (
              <ErrorMessage message={error} />
            ) : rooms.length === 0 ? (
              <motion.div variants={itemVariants}>
                <EmptyState
                  icon={
                    <svg
                      className="h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  }
                  title={t("common.emptyClass")}
                  description={t("dashboard.emptyDesc")}
                  action={
                    <div className="flex gap-3">
                      <Button onClick={() => setShowCreateModal(true)}>
                        <HiPlus className="h-4 w-4" />
                        {t("action.createClass")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowJoinModal(true)}
                      >
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
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
                >
                  <StatCard
                    icon={<HiAcademicCap className="h-5 w-5 text-indigo-600" />}
                    gradient="from-indigo-500/10 to-indigo-600/5"
                    label="Total Kelas"
                    value={rooms.length}
                  />
                  <StatCard
                    icon={<HiUsers className="h-5 w-5 text-emerald-600" />}
                    gradient="from-emerald-500/10 to-emerald-600/5"
                    label="Total Anggota"
                    value={totalMembers}
                  />
                  <StatCard
                    icon={
                      <HiBookOpen className="h-5 w-5 text-amber-600" />
                    }
                    gradient="from-amber-500/10 to-amber-600/5"
                    label="Kelas Aktif"
                    value={activeRooms}
                  />
                </motion.div>

                {/* Room Grid */}
                <motion.div
                  variants={itemVariants}
                  className="grid gap-5 sm:grid-cols-2"
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
