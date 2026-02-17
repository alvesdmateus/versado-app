import { Skeleton } from "@/components/shared/Skeleton";

export function MarketplaceDetailSkeleton() {
  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="mx-auto h-6 w-40" />
      </div>

      {/* Hero */}
      <Skeleton className="mx-5 h-40 rounded-xl" />

      {/* Info */}
      <div className="mx-5 mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Button */}
      <Skeleton className="mx-5 mt-4 h-11 rounded-lg" />

      {/* Sample cards */}
      <div className="mx-5 mt-6 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}
