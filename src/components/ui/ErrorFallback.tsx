"use client";

import { HiExclamationCircle } from "react-icons/hi";
import { Button } from "./Button";

interface ErrorFallbackProps {
  error?: Error | null;
  reset?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = "Terjadi Kesalahan",
  message,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
      <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-5">
        <HiExclamationCircle className="h-8 w-8 text-danger" />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-sm text-text-secondary text-center max-w-md mb-6">
        {message || error?.message || "Terjadi error yang tidak terduga."}
      </p>
      {reset && (
        <Button onClick={reset}>Coba Lagi</Button>
      )}
    </div>
  );
}
