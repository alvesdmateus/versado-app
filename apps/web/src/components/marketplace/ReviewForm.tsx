import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@versado/ui";
import { Textarea } from "@/components/shared";
import { marketplaceApi, type MarketplaceReview } from "@/lib/marketplace-api";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { StarRatingInput } from "./StarRatingInput";

interface ReviewFormProps {
  deckId: string;
  existingReview?: MarketplaceReview | null;
  onSubmitted: (review: MarketplaceReview) => void;
}

export function ReviewForm({ deckId, existingReview, onSubmitted }: ReviewFormProps) {
  const { t } = useTranslation("marketplace");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      showToast(t("pleaseSelectRating"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const review = await marketplaceApi.submitReview(deckId, {
        rating,
        comment: comment.trim() || undefined,
      });
      showToast(existingReview ? t("reviewUpdated") : t("reviewSubmitted"));
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
      <h3 className="text-sm font-semibold text-neutral-700">
        {existingReview ? t("editReview") : t("writeReview")}
      </h3>

      <div className="mt-3">
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div className="mt-3">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("reviewPlaceholder")}
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
          {isSubmitting ? t("submitting") : existingReview ? t("updateReview") : t("submitReview")}
        </Button>
      </div>
    </div>
  );
}
