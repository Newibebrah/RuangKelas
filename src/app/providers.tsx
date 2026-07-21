"use client";

import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";
import { RoomProvider } from "@/lib/room-context";
import { ThemeProvider } from "@/lib/theme-context";
import { LocaleProvider } from "@/lib/locale-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import QueryProvider from "@/lib/query-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <LocaleProvider>
          <AuthProvider>
            <ThemeProvider>
              <RoomProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: "var(--color-surface)",
                      color: "var(--color-text-primary)",
                      borderRadius: "12px",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-dropdown)",
                    },
                  }}
                />
              </RoomProvider>
            </ThemeProvider>
          </AuthProvider>
        </LocaleProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
