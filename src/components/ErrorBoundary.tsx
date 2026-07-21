"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { HiExclamationCircle } from "react-icons/hi";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidMount() {
    const handler = (e: Event) => {
      const msg =
        (e as ErrorEvent)?.message ||
        ((e as PromiseRejectionEvent)?.reason as string) ||
        "";
      if (
        typeof msg === "string" &&
        (msg.includes("Incorrect contents fetched") ||
          msg.includes("Failed to fetch") ||
          msg.includes("Loading chunk"))
      ) {
        window.location.reload();
      }
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", handler);
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Incorrect contents fetched") ||
        this.state.error?.message?.includes("Failed to fetch") ||
        this.state.error?.message?.includes("Loading chunk");

      if (isChunkError) {
        window.location.reload();
        return null;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface-muted px-6">
          <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-5">
            <HiExclamationCircle className="h-8 w-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-sm text-text-secondary text-center max-w-md mb-6">
            {this.state.error?.message || "Aplikasi mengalami error yang tidak terduga."}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()}>
              Muat Ulang
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
