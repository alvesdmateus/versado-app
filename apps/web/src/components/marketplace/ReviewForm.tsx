import { useState } from "react";
import { Button } from "@flashcard/ui";
import { Textarea } from "@/components/shared";
import { marketplaceApi, type MarketplaceReview } from "@/lib/marketplace-api";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { StarRatingInput } from "./StarRatingInput";

interface ReviewFormProps {
  deckId: string;
  onSubmitted: (review: MarketplaceReview) => void;
}

export function ReviewForm({ deckId, onSubmitted }: ReviewFormProps) {
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      showToast("Please select a rating", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await marketplaceApi.submitReview(deckId, {
        rating,
        comment: comment.trim() || undefined,
      });
      showToast("Review submitted!");
      onSubmitted(review);
      setRating(0);
      setComment("");
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl bg-neutral-0 p-4 shadow-card">
      <h3 className="text-sm font-semibold text-neutral-700">Write a Review</h3>

      <div className="mt-3">
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div className="mt-3">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="mt-3">
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting || rating === 0}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}
