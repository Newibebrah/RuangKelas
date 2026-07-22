"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";
import { useRouter, Link } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRoom } from "@/lib/room-context";
import { useAuth } from "@/lib/auth-context";
import { useMobile } from "@/lib/mobile-context";
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
import { useLocale } from "@/lib/locale-context";
import { HiArrowLeft, HiAcademicCap, HiClipboardCopy, HiCheck } from "react-icons/hi";
import { roomTabs, TabDefinition } from "@/lib/navigation";

function hashToColor(roomId: string): { hue: number; sat: number; light: number } {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = roomId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return { hue: Math.abs(hash % 360), sat: 72, light: 48 };
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  const { isMobile } = useMobile();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const roomId = params.roomId as string;
  const { currentRoom, setCurrentRoomId, loading, error, members } = useRoom();
  const { user } = useAuth();
  const { pengurus } = usePengurus(roomId);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    if (!currentRoom?.code) return;
    try {
      await navigator.clipboard.writeText(currentRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [currentRoom]);

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

  const roomColor = useMemo(() => hashToColor(roomId || ""), [roomId]);

  const coverGradient = useMemo(
    () => `linear-gradient(135deg, hsl(${roomColor.hue}, ${roomColor.sat}%, ${roomColor.light}%), hsl(${roomColor.hue}, ${roomColor.sat}%, ${Math.max(roomColor.light - 25, 8)}%))`,
    [roomColor]
  );

  const coverGlow = useMemo(
    () => `radial-gradient(ellipse 80% 50% at 50% 100%, hsl(${roomColor.hue}, ${roomColor.sat}%, ${roomColor.light}%, 0.25) 0%, transparent)`,
    [roomColor]
  );

  const visibleMembers = useMemo(() => members.slice(0, 6), [members]);

  if (loading) {
    return (
      <AuthGuard>
        <LoadingSpinner size="lg" message={t('common.loadingClass')} />
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
          <p className="text-text-primary font-semibold text-lg">{t('common.roomNotFound')}</p>
          <p className="text-text-secondary text-sm">{t('common.roomNotFoundDesc')}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-2">
            {t('action.back')} ke {t('nav.dashboard')}
          </Button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface-muted pb-16 md:pb-0 relative">
        <div
          className="fixed inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(${roomColor.hue}, 20%, 70%) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
            opacity: 0.08,
          }}
        />
        <div
          className="fixed inset-0 pointer-events-none -z-10"
          style={{
            background: `radial-gradient(ellipse 100% 60% at 50% -20%, hsl(${roomColor.hue}, ${roomColor.sat}%, ${roomColor.light}%, 0.04) 0%, transparent)`,
          }}
        />

        <div
          className="relative overflow-hidden"
          style={{ background: coverGradient }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: coverGlow }}
          />
          <div className="absolute inset-0 bg-black/10" />

          <div className={`relative max-w-7xl mx-auto ${isMobile ? "px-3 pt-3 pb-5" : "px-4 sm:px-6 lg:px-8 pt-5 pb-10"}`}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push("/dashboard")}
                className={`${isMobile ? "p-1.5" : "p-2"} rounded-xl bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 active:scale-95 transition-all`}
              >
                <HiArrowLeft className={`${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
              </button>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle />
                <NotificationBell />
                <UserMenu />
              </div>
            </div>

            <div className={`flex ${isMobile ? "flex-col gap-2" : "flex-col sm:flex-row sm:items-end sm:justify-between gap-4"}`}>
              <div className={isMobile ? "space-y-2" : "space-y-3"}>
                <h1 className={`${isMobile ? "text-xl" : "text-3xl md:text-4xl"} font-bold text-white drop-shadow-sm tracking-tight`}>
                  {currentRoom.name}
                </h1>
                {!isMobile && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 text-sm font-mono font-medium">
                      <span className="text-white/50 text-[10px] font-sans uppercase tracking-wider">{t('common.code')}</span>
                      {currentRoom.code}
                      <button
                        onClick={handleCopyCode}
                        className="p-0.5 rounded-md hover:bg-white/20 active:scale-90 transition-all"
                        aria-label="Copy room code"
                      >
                        {copied ? (
                          <HiCheck className="h-3.5 w-3.5 text-green-300" />
                        ) : (
                          <HiClipboardCopy className="h-3.5 w-3.5 text-white/70" />
                        )}
                      </button>
                    </span>

                    {visibleMembers.length > 0 && (
                      <div className="flex items-center">
                        <div className="flex -space-x-2">
                          {visibleMembers.map((member) => (
                            <div
                              key={member.userId}
                              className="w-8 h-8 rounded-full ring-2 ring-white/30 overflow-hidden bg-white/20"
                              title={member.displayName}
                            >
                              {member.photoURL ? (
                                <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                                  {member.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        {members.length > 6 && (
                          <span className="ml-1.5 text-xs text-white/70 font-medium">+{members.length - 6}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {currentRoom.description && !isMobile && (
                <p className="text-white/50 text-sm max-w-md sm:text-right line-clamp-2 leading-relaxed">
                  {currentRoom.description}
                </p>
              )}
            </div>

            {isMobile && (
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-mono">
                  <HiClipboardCopy className="h-3 w-3 text-white/60" />
                  {currentRoom.code}
                </span>
                {visibleMembers.length > 0 && (
                  <div className="flex items-center">
                    <div className="flex -space-x-1.5">
                      {visibleMembers.slice(0, 3).map((member) => (
                        <div key={member.userId} className="w-6 h-6 rounded-full ring-2 ring-white/30 overflow-hidden bg-white/20">
                          {member.photoURL ? (
                            <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white">
                              {member.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {members.length > 3 && (
                      <span className="ml-1 text-xs text-white/60">+{members.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`max-w-7xl mx-auto ${isMobile ? "px-3 pt-4" : "px-4 sm:px-6 lg:px-8 pt-6"}`}>
          <div className="flex gap-8">
            <aside className="hidden md:block w-56 shrink-0">
              <nav className="sticky top-24 space-y-1 p-2.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 shadow-sm">
                {visibleTabs.map((tab) => {
                  const href = tab.getHref(roomId);
                  const isActive = tab.exact
                    ? pathname === href
                    : pathname.startsWith(href);
                  return (
                    <Link
                      key={tab.labelKey}
                      href={href}
                      className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-text-muted hover:text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeTab"
                          transition={{ type: "spring" as const, stiffness: 500, damping: 35 }}
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20"
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-3">
                        <tab.icon className="h-4 w-4" />
                        {t('nav.' + tab.labelKey)}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <main className="flex-1 min-w-0 pb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        <BottomNav roomId={roomId} visibleTabs={visibleTabs} />
      </div>
    </AuthGuard>
  );
}
