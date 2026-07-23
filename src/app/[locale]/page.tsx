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
  { size: 60, top: "15%", left: "8%", delay: 0, duration: 6, color: "bg-indigo-500/10 dark:bg-indigo-400/10", rotate: 0 },
  { size: 40, top: "70%", left: "12%", delay: 0.5, duration: 7, color: "bg-purple-500/10 dark:bg-purple-400/10", rotate: 45 },
  { size: 80, top: "20%", right: "10%", delay: 1, duration: 8, color: "bg-pink-500/10 dark:bg-pink-400/10", rotate: 15 },
  { size: 50, top: "65%", right: "15%", delay: 0.3, duration: 6.5, color: "bg-cyan-500/10 dark:bg-cyan-400/10", rotate: 30 },
  { size: 35, top: "40%", left: "5%", delay: 0.8, duration: 5.5, color: "bg-amber-500/10 dark:bg-amber-400/10", rotate: 60 },
  { size: 45, top: "50%", right: "5%", delay: 1.2, duration: 7.5, color: "bg-emerald-500/10 dark:bg-emerald-400/10", rotate: 20 },
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
    <div className="flex flex-col min-h-screen bg-surface-muted relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      {/* Floating Shapes */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-2xl ${shape.color} pointer-events-none`}
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <HiAcademicCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary font-heading">{t('app.name')}</span>
          </div>
        }
      />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10">
        <motion.div
          className="text-center max-w-2xl"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={heroItemVariants}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/20"
          >
            <HiAcademicCap className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h1
            variants={heroItemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4"
          >
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t('app.heroTitle')}
            </span>
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className="text-lg sm:text-xl text-text-secondary mb-10 max-w-lg mx-auto leading-relaxed"
          >
            {t('app.heroDesc')}
          </motion.p>

          <motion.div variants={heroItemVariants} className="flex justify-center">
            <LoginButton />
          </motion.div>
        </motion.div>
      </main>

      <footer className="py-6 text-center text-sm text-text-muted bg-surface/80 backdrop-blur-sm border-t border-border relative z-10">
        &copy; {new Date().getFullYear()} RuangKelas
      </footer>
    </div>
  );
}
