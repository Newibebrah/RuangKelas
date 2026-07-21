"use client";

import { useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UserMenu } from "@/components/auth/UserMenu";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/ui/BottomNav";
import { NotificationBell } from "@/components/NotificationBell";
import {
  HiAcademicCap,
  HiClipboardList,
  HiCash,
  HiUsers,
  HiArrowLeft,
} from "react-icons/hi";

const tabs = [
  {
    label: "Beranda",
    icon: HiAcademicCap,
    exact: true,
  },
  {
    label: "Tugas",
    icon: HiClipboardList,
    exact: false,
  },
  {
    label: "Kas",
    icon: HiCash,
    exact: false,
  },
  {
    label: "Pengurus",
    icon: HiUsers,
    exact: false,
  },
];

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomId = params.roomId as string;
  const { currentRoom, setCurrentRoomId, loading, error } = useRoom();

  useEffect(() => {
    if (roomId) {
      setCurrentRoomId(roomId);
    }
    return () => {
      setCurrentRoomId(null);
    };
  }, [roomId, setCurrentRoomId]);

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
          <p className="text-gray-500">Kelas tidak ditemukan</p>
          <Button onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <HiArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentRoom.name}
                  </h1>
                  <p className="text-xs text-gray-400">
                    Kode: {currentRoom.code}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <nav className="hidden md:block bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-1 -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const href = `/room/${roomId}/${tab.label.toLowerCase() === "beranda" ? "" : tab.label.toLowerCase() === "tugas" ? "tugas" : tab.label.toLowerCase() === "kas" ? "kas" : "pengurus"}`;
                const displayHref = tab.label === "Beranda"
                  ? `/room/${roomId}`
                  : `/room/${roomId}/${tab.label.toLowerCase()}`;
                const isActive = tab.exact
                  ? pathname === displayHref
                  : pathname.startsWith(displayHref);
                return (
                  <Link
                    key={tab.label}
                    href={displayHref}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
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
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <BottomNav roomId={roomId} />
      </div>
    </AuthGuard>
  );
}
