"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { FcGoogle } from "react-icons/fc";
import { HiExclamationCircle } from "react-icons/hi";

export function LoginButton() {
  const { signInWithGoogle, loading, error } = useAuth();

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        onClick={signInWithGoogle}
        variant="outline"
        size="lg"
        isLoading={loading}
        className="w-full max-w-sm"
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Masuk dengan Google
      </Button>
      {error && (
        <div className="flex items-start gap-3 max-w-sm p-3.5 bg-danger-light rounded-xl">
          <HiExclamationCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}
    </div>
  );
}
