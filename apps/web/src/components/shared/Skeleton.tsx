import { cn } from "@flashcard/ui";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200",
        className
      )}
    />
  );
}

export function DeckGridSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 px-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-neutral-0 shadow-card">
          <Skeleton className="h-28 w-full rounded-none" />
          <div className="p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-3">
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="pb-4">
      <div className="px-5 pt-6 pb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-24" />
      </div>
      <div className="mx-5 rounded-2xl bg-neutral-0 p-5 shadow-card">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-10 w-full rounded-xl" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 px-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-0 p-3 shadow-card">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
