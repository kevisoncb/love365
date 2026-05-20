type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <span
      className={`love-skeleton block rounded-xl bg-white/[0.06] ${className}`}
      aria-hidden
    />
  );
}

export function TributePageSkeleton() {
  return (
    <main className="love-cinematic-bg flex min-h-[100svh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 rounded-[2rem] border border-[var(--border)] p-6">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="aspect-[9/16] w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
    </main>
  );
}
