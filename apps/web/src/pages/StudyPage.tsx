import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ReviewRating } from "@versado/algorithms";
import { IndexedDBAdapter } from "@versado/storage";
import { StudyQueueService } from "@versado/core/services";
import {
  FlashcardView,
  ReviewButtons,
  ReviewKeyboardHandler,
  StudyProgress,
  SessionSummary,
} from "@versado/ui/components";
import { useStudySession } from "../hooks/useStudySession";
import { FlashcardRepositoryImpl, CardProgressRepositoryImpl } from "../repositories";

export interface StudyPageProps {
  deckId: string;
  userId?: string;
  onBack?: () => void;
}

const ANONYMOUS_USER_ID = "local-user";

export function StudyPage({ deckId, userId, onBack }: StudyPageProps) {
  const { t } = useTranslation();
  const effectiveUserId = userId ?? ANONYMOUS_USER_ID;

  // Create storage and services
  const { storage, studyQueueService } = useMemo(() => {
    const storage = new IndexedDBAdapter();
    const flashcardRepo = new FlashcardRepositoryImpl(storage);
    const progressRepo = new CardProgressRepositoryImpl(storage);
    const service = new StudyQueueService(progressRepo, flashcardRepo);
    return { storage, studyQueueService: service };
  }, []);

  // Clean up storage on unmount
  useEffect(() => {
    return () => {
      storage.close();
    };
  }, [storage]);

  const {
    state,
    currentCard,
    session,
    isFlipped,
    cardsRemaining,
    totalCards,
    flip,
    submitReview,
    startSession,
  } = useStudySession(studyQueueService, {
    deckId,
    userId: effectiveUserId,
    cardsPerSession: 20,
    includeNew: true,
  });

  // Handle keyboard shortcuts for flipping
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state === "studying" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        flip();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state, flip]);

  const handleReview = async (rating: ReviewRating) => {
    await submitReview(rating);
  };

  // Loading state
  if (state === "loading") {
    return (
      <div className="study-page study-page--loading">
        <div className="study-page__loader">{t("study.loading")}</div>
      </div>
    );
  }

  // Empty state - no cards to study
  if (state === "empty") {
    return (
      <div className="study-page study-page--empty">
        <div className="study-page__empty-message">
          <h2>{t("study.noCardsDue")}</h2>
          <p>{t("study.allCaughtUp")}</p>
          {onBack && (
            <button className="study-page__back-button" onClick={onBack}>
              {t("common.back")}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Complete state - session finished
  if (state === "complete" && session) {
    const totalTimeMs = session.endedAt
      ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
      : 0;

    return (
      <div className="study-page study-page--complete">
        <SessionSummary
          cardsStudied={session.stats.cardsStudied}
          correctCount={session.stats.correctCount}
          incorrectCount={session.stats.incorrectCount}
          averageTimeMs={session.stats.averageTimeMs}
          totalTimeMs={totalTimeMs}
          onContinue={startSession}
          onFinish={onBack}
        />
      </div>
    );
  }

  // Studying/Reviewing state
  if (!currentCard) {
    return null;
  }

  const current = totalCards - cardsRemaining + 1;

  return (
    <ReviewKeyboardHandler onReview={handleReview} enabled={state === "reviewing"}>
      <div className="study-page" ref={containerRef}>
        <header className="study-page__header">
          {onBack && (
            <button className="study-page__back-button" onClick={onBack}>
              &larr; {t("common.back")}
            </button>
          )}
          <StudyProgress
            current={current}
            total={totalCards}
            correctCount={session?.stats.correctCount ?? 0}
            incorrectCount={session?.stats.incorrectCount ?? 0}
          />
        </header>

        <main className="study-page__content">
          <FlashcardView
            front={<div className="study-page__card-text">{currentCard.flashcard.front}</div>}
            back={<div className="study-page__card-text">{currentCard.flashcard.back}</div>}
            isFlipped={isFlipped}
            onFlip={state === "studying" ? flip : undefined}
          />
        </main>

        <footer className="study-page__footer">
          {state === "reviewing" && (
            <ReviewButtons onReview={handleReview} showDescriptions />
          )}
          {state === "studying" && (
            <div className="study-page__hint">
              {t("study.revealAnswer")}
            </div>
          )}
        </footer>
      </div>
    </ReviewKeyboardHandler>
  );
}
