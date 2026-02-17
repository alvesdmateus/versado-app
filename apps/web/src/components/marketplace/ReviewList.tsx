import type { MarketplaceReview } from "@/lib/marketplace-api";
import { StarRating } from "./StarRating";

interface ReviewListProps {
  reviews: MarketplaceReview[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-400">No reviews yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg bg-neutral-0 p-3 shadow-card">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
              {getInitial(review.userName)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">
                {review.userName}
              </p>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" />
                <span className="text-xs text-neutral-400">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}
