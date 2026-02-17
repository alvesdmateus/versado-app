export type ReviewRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface Review {
  id: string;
  cardId: string;
  rating: ReviewRating;
  responseTimeMs: number;
  reviewedAt: Date;
}

export interface SessionStats {
  cardsStudied: number;
  correctCount: number;
  incorrectCount: number;
  averageTimeMs: number;
}

export interface StudySession {
  id: string;
  userId: string | null; // null for anonymous/local sessions
  deckId: string;
  startedAt: Date;
  endedAt: Date | null;
  reviews: Review[];
  stats: SessionStats;
}

export interface CreateStudySessionInput {
  userId?: string;
  deckId: string;
}

export function createStudySession(input: CreateStudySessionInput): StudySession {
  return {
    id: crypto.randomUUID(),
    userId: input.userId ?? null,
    deckId: input.deckId,
    startedAt: new Date(),
    endedAt: null,
    reviews: [],
    stats: {
      cardsStudied: 0,
      correctCount: 0,
      incorrectCount: 0,
      averageTimeMs: 0,
    },
  };
}

export interface AddReviewInput {
  cardId: string;
  rating: ReviewRating;
  responseTimeMs: number;
}

export function addReview(session: StudySession, input: AddReviewInput): StudySession {
  const review: Review = {
    id: crypto.randomUUID(),
    cardId: input.cardId,
    rating: input.rating,
    responseTimeMs: input.responseTimeMs,
    reviewedAt: new Date(),
  };

  const reviews = [...session.reviews, review];
  const cardsStudied = reviews.length;
  const correctCount = reviews.filter((r) => r.rating >= 3).length;
  const incorrectCount = cardsStudied - correctCount;
  const totalTimeMs = reviews.reduce((sum, r) => sum + r.responseTimeMs, 0);
  const averageTimeMs = cardsStudied > 0 ? Math.round(totalTimeMs / cardsStudied) : 0;

  return {
    ...session,
    reviews,
    stats: {
      cardsStudied,
      correctCount,
      incorrectCount,
      averageTimeMs,
    },
  };
}

export function endSession(session: StudySession): StudySession {
  return {
    ...session,
    endedAt: new Date(),
  };
}
