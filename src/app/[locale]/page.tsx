"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AppHeader } from "@/components/ui/AppHeader";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "@/lib/locale-context";
import { HiAcademicCap } from "react-icons/hi";
import { motion } from "framer-motion";

const floatingShapes = [
  { size: 80, top: "12%", left: "5%", delay: 0, duration: 7, color: "bg-indigo-500/15 dark:bg-indigo-400/10", rotate: 0 },
  { size: 50, top: "75%", left: "10%", delay: 0.5, duration: 8, color: "bg-purple-500/15 dark:bg-purple-400/10", rotate: 45 },
  { size: 100, top: "18%", right: "8%", delay: 1, duration: 9, color: "bg-pink-500/15 dark:bg-pink-400/10", rotate: 15 },
  { size: 60, top: "70%", right: "12%", delay: 0.3, duration: 7.5, color: "bg-cyan-500/15 dark:bg-cyan-400/10", rotate: 30 },
  { size: 40, top: "45%", left: "3%", delay: 0.8, duration: 6, color: "bg-amber-500/15 dark:bg-amber-400/10", rotate: 60 },
  { size: 55, top: "55%", right: "3%", delay: 1.2, duration: 8.5, color: "bg-emerald-500/15 dark:bg-emerald-400/10", rotate: 20 },
  { size: 30, top: "30%", left: "45%", delay: 0.6, duration: 6.5, color: "bg-rose-500/15 dark:bg-rose-400/10", rotate: 10 },
];

const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const shapeVariants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -10 },
  visible: (custom: { delay: number }) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { delay: custom.delay, duration: 0.8, ease: "easeOut" as const },
  }),
};

export default function HomePage() {
  const { t } = useLocale();
  const { user, loading } = useAuth();
  const router = useRouter();
  const wasLoggedOut = useRef(true);

  useEffect(() => {
    if (!loading && !user) {
      wasLoggedOut.current = true;
    }
    if (!loading && user && wasLoggedOut.current) {
      wasLoggedOut.current = false;
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner size="lg" message={t('common.loading')} />;
  }

  if (user) {
    return <LoadingSpinner size="lg" message={t('common.redirecting')} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 dark:bg-slate-950 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 animate-gradient pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.3),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_80%_80%,rgba(192,132,252,0.15),transparent)] pointer-events-none" />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating Shapes */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-3xl ${shape.color} pointer-events-none`}
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            left: shape.left as string | undefined,
            right: shape.right as string | undefined,
            rotate: shape.rotate,
          }}
          custom={{ delay: shape.delay }}
          variants={shapeVariants}
          initial="hidden"
          animate="visible"
        />
      ))}

      <AppHeader
        left={
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <HiAcademicCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              {t('app.name')}
            </span>
          </div>
        }
      />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <motion.div
          className="text-center max-w-3xl"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={heroItemVariants}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30 animate-float"
          >
            <HiAcademicCap className="h-12 w-12 text-white" />
          </motion.div>

          <motion.div
            variants={heroItemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold mb-6 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Platform Manajemen Kelas Digital
          </motion.div>

          <motion.h1
            variants={heroItemVariants}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              {t('app.heroTitle')}
            </span>
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className="text-lg sm:text-xl text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed"
          >
            {t('app.heroDesc')}
          </motion.p>

          <motion.div variants={heroItemVariants} className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-2xl opacity-30 animate-glow" />
              <LoginButton />
            </div>
          </motion.div>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500 bg-white/[0.02] border-t border-white/5 relative z-10 backdrop-blur-sm">
        &copy; {new Date().getFullYear()} RuangKelas
      </footer>
    </div>
  );
}
