"use client";

import { ErrorFallback } from "@/components/ui/ErrorFallback";

export default function RoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      message={error.message || "Gagal memuat halaman kelas."}
    />
  );
}
