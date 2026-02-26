import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { MarketplaceReview } from "@/lib/marketplace-api";
import { ConfirmDialog } from "@/components/shared";
import { StarRating } from "./StarRating";

interface ReviewListProps {
  reviews: MarketplaceReview[];
  currentUserId?: string;
  onDelete?: (reviewId: string) => void;
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

export function ReviewList({ reviews, currentUserId, onDelete }: ReviewListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (reviews.length === 0) {
    return (
      <p className="text-center text-sm text-neutral-400">No reviews yet</p>
    );
  }

  return (
    <>
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
              {currentUserId && review.userId === currentUserId && onDelete && (
                <button
                  onClick={() => setDeleteTarget(review.id)}
                  className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-error-50 hover:text-error-500"
                  aria-label="Delete review"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {review.comment && (
              <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget && onDelete) {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Delete Review"
        message="Are you sure you want to delete your review? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
