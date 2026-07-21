"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginButton } from "@/components/auth/LoginButton";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-center px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <HiAcademicCap className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">RuangKelas</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center max-w-2xl">
          <HiAcademicCap className="h-20 w-20 text-blue-600 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Kelola Kelas Jadi Lebih Mudah
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Platform digital untuk mengelola kelas, tugas, kas kelas, dan
            pengurus organisasi. Semua dalam satu tempat.
          </p>
          <div className="flex justify-center">
            <LoginButton />
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400 border-t bg-white">
        &copy; {new Date().getFullYear()} RuangKelas
      </footer>
    </div>
  );
}
