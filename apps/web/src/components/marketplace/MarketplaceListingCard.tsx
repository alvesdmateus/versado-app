import { Star, Download, Layers } from "lucide-react";

export interface MarketplaceListingCardProps {
  title: string;
  creator: string;
  thumbnailUrl: string | null;
  gradient?: string;
  price: number | null;
  rating: number;
  reviewCount: string;
  downloads: string;
  onClick?: () => void;
}

export function MarketplaceListingCard({
  title,
  creator,
  thumbnailUrl,
  gradient = "from-primary-100 to-primary-200",
  price,
  rating,
  reviewCount,
  downloads,
  onClick,
}: MarketplaceListingCardProps) {
  const isFree = price === null || price === 0;

  return (
    <button
      onClick={onClick}
      className="flex gap-3 rounded-xl bg-neutral-0 p-3 text-left shadow-card transition-all hover:shadow-card-hover active:scale-[0.99]"
    >
      {/* Thumbnail */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-200">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br dark:brightness-75 ${gradient}`}>
            <Layers className="h-6 w-6 text-white/40" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Title + Price */}
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-neutral-900">
            {title}
          </h3>
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
              isFree
                ? "bg-success-100 text-success-700"
                : "bg-primary-500 text-white"
            }`}
          >
            {isFree ? "Free" : `$${price.toFixed(2)}`}
          </span>
        </div>

        {/* Creator */}
        <p className="mt-0.5 text-xs text-neutral-500">by {creator}</p>

        {/* Stats */}
        <div className="mt-1.5 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />
            <span className="text-xs font-semibold text-neutral-700">{rating}</span>
            <span className="text-xs text-neutral-400">({reviewCount})</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-xs text-neutral-400">{downloads}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
