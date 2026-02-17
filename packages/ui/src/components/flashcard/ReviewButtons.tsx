import type { ReactNode } from "react";
import type { ReviewRating } from "@flashcard/algorithms";

export interface ReviewButtonConfig {
  rating: ReviewRating;
  label: string;
  shortcut: string;
  description: string;
}

export const DEFAULT_REVIEW_BUTTONS: ReviewButtonConfig[] = [
  { rating: 1, label: "Again", shortcut: "1", description: "Complete blank, wrong answer" },
  { rating: 2, label: "Hard", shortcut: "2", description: "Correct but with difficulty" },
  { rating: 3, label: "Good", shortcut: "3", description: "Correct with some hesitation" },
  { rating: 4, label: "Easy", shortcut: "4", description: "Perfect, instant recall" },
];

export interface ReviewButtonsProps {
  onReview: (rating: ReviewRating) => void;
  disabled?: boolean;
  buttons?: ReviewButtonConfig[];
  showDescriptions?: boolean;
  className?: string;
}

export function ReviewButtons({
  onReview,
  disabled = false,
  buttons = DEFAULT_REVIEW_BUTTONS,
  showDescriptions = false,
  className = "",
}: ReviewButtonsProps) {
  const getRatingClass = (rating: ReviewRating): string => {
    switch (rating) {
      case 1:
        return "review-button--again";
      case 2:
        return "review-button--hard";
      case 3:
        return "review-button--good";
      case 4:
        return "review-button--easy";
    }
  };

  return (
    <div className={`review-buttons ${className}`}>
      {buttons.map((button) => (
        <button
          key={button.rating}
          type="button"
          className={`review-button ${getRatingClass(button.rating)}`}
          onClick={() => onReview(button.rating)}
          disabled={disabled}
          title={`${button.description} (Press ${button.shortcut})`}
        >
          <span className="review-button__label">{button.label}</span>
          <span className="review-button__shortcut">{button.shortcut}</span>
          {showDescriptions && (
            <span className="review-button__description">{button.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export interface ReviewKeyboardHandlerProps {
  onReview: (rating: ReviewRating) => void;
  enabled?: boolean;
  children: ReactNode;
}

export function ReviewKeyboardHandler({
  onReview,
  enabled = true,
  children,
}: ReviewKeyboardHandlerProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!enabled) return;

    const key = e.key;
    if (key >= "1" && key <= "4") {
      e.preventDefault();
      onReview(parseInt(key, 10) as ReviewRating);
    }
  };

  return (
    <div onKeyDown={handleKeyDown} tabIndex={-1}>
      {children}
    </div>
  );
}
