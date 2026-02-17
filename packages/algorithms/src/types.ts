/** Review rating: 1=Again, 2=Hard, 3=Good, 4=Easy */
export type ReviewRating = 1 | 2 | 3 | 4;

/** Input card state for SM-2 calculation */
export interface SM2Card {
  easeFactor: number; // Default 2.5, min 1.3
  interval: number; // Days until next review
  repetitions: number; // Consecutive correct answers
}

/** Result of SM-2 calculation */
export interface SM2Result extends SM2Card {
  nextReviewDate: Date;
}

/** Maps user-friendly rating to SM-2 quality score */
export const RATING_TO_QUALITY: Record<ReviewRating, number> = {
  1: 0, // Again - complete failure
  2: 3, // Hard - correct with difficulty
  3: 4, // Good - correct with hesitation
  4: 5, // Easy - perfect response
};
