import { useState, useCallback, useRef, useEffect } from "react";
import type { ReviewRating } from "@flashcard/algorithms";
import {
  createStudySession,
  addReview,
  endSession,
  type StudySession,
} from "@flashcard/core/entities";
import type { StudyQueueService, StudyCard } from "@flashcard/core/services";

export type StudySessionState = "loading" | "studying" | "reviewing" | "complete" | "empty";

export interface UseStudySessionOptions {
  deckId: string;
  userId: string;
  cardsPerSession?: number;
  includeNew?: boolean;
}

export interface UseStudySessionReturn {
  state: StudySessionState;
  currentCard: StudyCard | null;
  session: StudySession | null;
  isFlipped: boolean;
  cardsRemaining: number;
  totalCards: number;
  flip: () => void;
  submitReview: (rating: ReviewRating) => Promise<void>;
  startSession: () => Promise<void>;
  endStudySession: () => void;
}

export function useStudySession(
  studyQueueService: StudyQueueService,
  options: UseStudySessionOptions
): UseStudySessionReturn {
  const { deckId, userId, cardsPerSession = 20, includeNew = true } = options;

  const [state, setState] = useState<StudySessionState>("loading");
  const [session, setSession] = useState<StudySession | null>(null);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardStartTime = useRef<number>(Date.now());

  const currentCard = cards[currentIndex] ?? null;
  const cardsRemaining = cards.length - currentIndex;
  const totalCards = cards.length;

  const startSession = useCallback(async () => {
    setState("loading");
    setIsFlipped(false);
    setCurrentIndex(0);

    try {
      // Get due cards first
      const dueCards = await studyQueueService.getNextCards(
        deckId,
        userId,
        cardsPerSession
      );

      let allCards = [...dueCards];

      // If we need more cards and includeNew is true, get new cards
      if (includeNew && allCards.length < cardsPerSession) {
        const remaining = cardsPerSession - allCards.length;
        const newCards = await studyQueueService.getNewCards(
          deckId,
          userId,
          remaining
        );
        allCards = [...allCards, ...newCards];
      }

      if (allCards.length === 0) {
        setState("empty");
        return;
      }

      // Create a new study session
      const newSession = createStudySession({ userId, deckId });
      setSession(newSession);
      setCards(allCards);
      setCurrentIndex(0);
      cardStartTime.current = Date.now();
      setState("studying");
    } catch (error) {
      console.error("Failed to start study session:", error);
      setState("empty");
    }
  }, [deckId, userId, cardsPerSession, includeNew, studyQueueService]);

  const flip = useCallback(() => {
    if (state === "studying") {
      setIsFlipped(true);
      setState("reviewing");
    }
  }, [state]);

  const submitReview = useCallback(
    async (rating: ReviewRating) => {
      if (!currentCard || !session || state !== "reviewing") return;

      const responseTimeMs = Date.now() - cardStartTime.current;

      // Update card progress in storage
      await studyQueueService.submitReview(currentCard.progress.id, rating);

      // Update session
      const updatedSession = addReview(session, {
        cardId: currentCard.flashcard.id,
        rating,
        responseTimeMs,
      });
      setSession(updatedSession);

      // Move to next card or complete
      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        setSession(endSession(updatedSession));
        setState("complete");
      } else {
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
        cardStartTime.current = Date.now();
        setState("studying");
      }
    },
    [currentCard, session, state, currentIndex, cards.length, studyQueueService]
  );

  const endStudySession = useCallback(() => {
    if (session) {
      setSession(endSession(session));
    }
    setState("complete");
  }, [session]);

  // Auto-start session on mount
  useEffect(() => {
    startSession();
  }, []);

  return {
    state,
    currentCard,
    session,
    isFlipped,
    cardsRemaining,
    totalCards,
    flip,
    submitReview,
    startSession,
    endStudySession,
  };
}
