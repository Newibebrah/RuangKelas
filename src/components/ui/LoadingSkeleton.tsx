interface LoadingSkeletonProps {
  variant?: "card" | "list" | "table" | "text" | "avatar";
  count?: number;
}

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-border rounded ${className}`}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 space-y-4 shadow-card">
      <div className="flex items-start justify-between">
        <SkeletonBar className="h-5 w-2/3" />
        <SkeletonBar className="h-5 w-5 shrink-0" />
      </div>
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-4/5" />
      <div className="pt-2">
        <SkeletonBar className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <SkeletonBar className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBar className="h-4 w-1/3" />
        <SkeletonBar className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <SkeletonBar className="h-4 w-1/4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBar key={i} className="h-4 w-8" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <SkeletonBar className="h-6 w-1/4" />
          {Array.from({ length: 4 }).map((_, j) => (
            <SkeletonBar className="h-6 w-8" key={j} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBar className="h-4 w-3/4" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-5/6" />
      <SkeletonBar className="h-4 w-2/3" />
    </div>
  );
}

function AvatarSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <SkeletonBar className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBar className="h-4 w-1/3" />
        <SkeletonBar className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  variant = "card",
  count = 3,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count });

  const gridLayout =
    variant === "card"
      ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      : variant === "list"
        ? "divide-y divide-border-light"
        : variant === "avatar"
          ? "space-y-4"
          : "";

  return (
    <div className={gridLayout}>
      {variant === "card" && items.map((_, i) => <CardSkeleton key={i} />)}
      {variant === "list" && items.map((_, i) => <ListSkeleton key={i} />)}
      {variant === "table" && <TableSkeleton />}
      {variant === "text" && items.map((_, i) => <TextSkeleton key={i} />)}
      {variant === "avatar" && items.map((_, i) => <AvatarSkeleton key={i} />)}
    </div>
  );
}
