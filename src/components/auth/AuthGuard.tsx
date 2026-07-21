"use client";

import { useAuth } from "@/lib/auth-context";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoginButton } from "./LoginButton";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="lg" message="Memuat..." />;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Akses Terbatas
            </h1>
            <p className="text-text-secondary">
              Silakan masuk untuk mengakses halaman ini
            </p>
          </div>
          <LoginButton />
        </div>
    );
  }

  return <>{children}</>;
}
