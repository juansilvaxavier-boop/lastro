export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-200 ${className}`} />;
}

export function CardGridSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: quantidade }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-4 h-28 w-full" />
          <Skeleton className="mt-4 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
