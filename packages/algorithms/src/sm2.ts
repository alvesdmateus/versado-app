import type { ReviewRating, SM2Card, SM2Result } from "./types";
import { RATING_TO_QUALITY } from "./types";

const MIN_EASE_FACTOR = 1.3;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculate the next review state using the SM-2 algorithm.
 *
 * The SM-2 algorithm adjusts the ease factor and interval based on
 * how well the user recalled the card:
 * - Quality >= 3 (Hard/Good/Easy): Card advances, interval increases
 * - Quality < 3 (Again): Card resets to beginning of learning
 *
 * @param card - Current card state (easeFactor, interval, repetitions)
 * @param rating - User's rating (1=Again, 2=Hard, 3=Good, 4=Easy)
 * @returns New card state with next review date
 */
export function calculateSM2(card: SM2Card, rating: ReviewRating): SM2Result {
  const quality = RATING_TO_QUALITY[rating];

  let { easeFactor, interval, repetitions } = card;

  if (quality >= 3) {
    // Correct response: increase interval based on repetition count
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  } else {
    // Failed: reset to beginning
    interval = 1;
    repetitions = 0;
  }

  // Adjust ease factor using SM-2 formula
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const easeAdjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + easeAdjustment);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: addDays(new Date(), interval),
  };
}

/**
 * Get the default state for a new card.
 */
export function getDefaultSM2State(): SM2Card {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  };
}
