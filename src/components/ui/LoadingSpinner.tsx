interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export function LoadingSpinner({
  size = "md",
  message,
}: LoadingSpinnerProps) {
  const sizes: Record<string, string> = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 animate-fade-in">
      <div className="relative">
        <div
          className={`${sizes[size]} border-[3px] border-primary-200/40 dark:border-primary-700/40 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin`}
        />
      </div>
      {message && <p className="text-sm font-medium text-text-muted animate-pulse-subtle">{message}</p>}
    </div>
  );
}
