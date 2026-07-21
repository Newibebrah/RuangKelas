"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { usePengurus } from "@/hooks/usePengurus";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UserMenu } from "@/components/auth/UserMenu";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/ui/BottomNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { HiArrowLeft, HiAcademicCap } from "react-icons/hi";
import { roomTabs, TabDefinition } from "@/lib/navigation";

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomId = params.roomId as string;
  const { currentRoom, setCurrentRoomId, loading, error, members } = useRoom();
  const { user } = useAuth();
  const { pengurus } = usePengurus(roomId);

  useEffect(() => {
    if (roomId) {
      setCurrentRoomId(roomId);
    }
    return () => {
      setCurrentRoomId(null);
    };
  }, [roomId, setCurrentRoomId]);

  const visibleTabs = useMemo(() => {
    const currentMember = members.find((m) => m.userId === user?.id);
    const isAdmin = currentMember?.role === "admin";
    const pengurusJabatan = pengurus.find((p) => p.userId === user?.id)?.jabatan.toLowerCase() ?? "";

    return roomTabs.filter((tab: TabDefinition) => {
      if (!tab.showIf) return true;
      if (isAdmin) return true;
      if (tab.showIf === "bendahara" && pengurusJabatan === "bendahara") return true;
      if (tab.showIf === "ketua" && pengurusJabatan === "ketua") return true;
      if (tab.showIf === "sekretaris" && pengurusJabatan === "sekretaris") return true;
      return false;
    });
  }, [members, user?.id, pengurus]);

  if (loading) {
    return (
      <AuthGuard>
        <LoadingSpinner size="lg" message="Memuat kelas..." />
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <ErrorMessage message={error} onRetry={() => setCurrentRoomId(roomId)} />
      </AuthGuard>
    );
  }

  if (!currentRoom) {
    return (
      <AuthGuard>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-2">
            <HiAcademicCap className="h-8 w-8 text-danger" />
          </div>
          <p className="text-text-primary font-semibold text-lg">Kelas tidak ditemukan</p>
          <p className="text-text-secondary text-sm">Kelas yang kamu cari mungkin sudah dihapus</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-2">
            Kembali ke Dashboard
          </Button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-muted pb-16 md:pb-0">
        <header className="bg-surface/80 backdrop-blur-lg border-b border-border sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="p-2 rounded-xl hover:bg-surface-hover transition-colors shrink-0"
                >
                  <HiArrowLeft className="h-5 w-5 text-text-secondary" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-text-primary truncate">
                    {currentRoom.name}
                  </h1>
                  <p className="text-xs text-text-muted">
                    Kode: <span className="font-mono font-medium text-primary-600">{currentRoom.code}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <LanguageSwitcher />
                <ThemeToggle />
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <nav className="hidden md:block bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0 overflow-x-auto">
              {visibleTabs.map((tab) => {
                const displayHref = tab.getHref(roomId);
                const isActive = tab.exact
                  ? pathname === displayHref
                  : pathname.startsWith(displayHref);
                return (
                  <Link
                    key={tab.label}
                    href={displayHref}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? "text-primary-600"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary-500" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <BottomNav roomId={roomId} visibleTabs={visibleTabs} />
      </div>
    </AuthGuard>
  );
}
