import { useState, useCallback, type ReactNode } from "react";

export interface FlashcardViewProps {
  front: ReactNode;
  back: ReactNode;
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
}

export function FlashcardView({
  front,
  back,
  isFlipped: controlledFlipped,
  onFlip,
  className = "",
}: FlashcardViewProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);

  const isControlled = controlledFlipped !== undefined;
  const isFlipped = isControlled ? controlledFlipped : internalFlipped;

  const handleFlip = useCallback(() => {
    if (onFlip) {
      onFlip();
    }
    if (!isControlled) {
      setInternalFlipped((prev) => !prev);
    }
  }, [isControlled, onFlip]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip]
  );

  return (
    <div
      className={`flashcard-view ${isFlipped ? "flashcard-view--flipped" : ""} ${className}`}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Showing answer. Click to show question." : "Showing question. Click to show answer."}
    >
      <div className="flashcard-view__inner">
        <div className="flashcard-view__face flashcard-view__front">
          <div className="flashcard-view__content">{front}</div>
          <div className="flashcard-view__hint">Tap to reveal answer</div>
        </div>
        <div className="flashcard-view__face flashcard-view__back">
          <div className="flashcard-view__content">{back}</div>
        </div>
      </div>
    </div>
  );
}
