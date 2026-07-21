"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { FcGoogle } from "react-icons/fc";

export function LoginButton() {
  const { signInWithGoogle, loading } = useAuth();

  return (
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
  );
}
