"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRoom } from "@/lib/room-context";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { UserMenu } from "@/components/auth/UserMenu";
import { RoomCard } from "@/components/room/RoomCard";
import { CreateRoomModal } from "@/components/room/CreateRoomModal";
import { JoinRoomModal } from "@/components/room/JoinRoomModal";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { HiAcademicCap, HiPlus, HiLogin } from "react-icons/hi";

export default function DashboardPage() {
  const { user } = useAuth();
  const { rooms, loading, error } = useRoom();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-muted">
        <header className="bg-surface/80 backdrop-blur-lg border-b border-border sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                  <HiAcademicCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-text-primary">
                  RuangKelas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJoinModal(true)}
                >
                  <HiLogin className="h-4 w-4" />
                  Gabung
                </Button>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  <HiPlus className="h-4 w-4" />
                  Buat Kelas
                </Button>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary">
              Kelas Saya
            </h1>
            <p className="text-text-secondary mt-1">
              Kelola kelas yang kamu ikuti atau buat
            </p>
          </div>

          {loading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : rooms.length === 0 ? (
            <EmptyState
              icon={<HiAcademicCap className="h-8 w-8" />}
              title="Belum ada kelas"
              description="Buat kelas baru atau gabung dengan kode kelas yang sudah ada"
              action={
                <div className="flex gap-3">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <HiPlus className="h-4 w-4" />
                    Buat Kelas
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowJoinModal(true)}
                  >
                    <HiLogin className="h-4 w-4" />
                    Gabung Kelas
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
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
