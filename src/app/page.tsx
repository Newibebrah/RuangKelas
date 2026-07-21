"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AppHeader } from "@/components/ui/AppHeader";
import { useRouter } from "next/navigation";
import { HiAcademicCap } from "react-icons/hi";

export default function HomePage() {
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
    return <LoadingSpinner size="lg" message="Memuat..." />;
  }

  if (user) {
    return <LoadingSpinner size="lg" message="Mengarahkan ke dashboard..." />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-muted">
      <AppHeader
        left={
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <HiAcademicCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">RuangKelas</span>
          </div>
        }
      />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center max-w-2xl">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-8">
            <HiAcademicCap className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary mb-4">
            Kelola Kelas Jadi Lebih Mudah
          </h1>
          <p className="text-lg text-text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
            Platform digital untuk mengelola kelas, tugas, kas kelas, dan
            pengurus organisasi. Semua dalam satu tempat.
          </p>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-text-muted bg-surface border-t border-border">
        &copy; {new Date().getFullYear()} RuangKelas
      </footer>
    </div>
  );
}
