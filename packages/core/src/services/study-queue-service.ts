import { calculateSM2, type ReviewRating } from "@flashcard/algorithms";
import type { CardProgress, CardStatus } from "../entities/card-progress";
import type { Flashcard } from "../entities/flashcard";
import type { CardProgressRepository } from "../repositories/card-progress-repository";
import type { FlashcardRepository } from "../repositories/flashcard-repository";

export interface StudyCard {
  flashcard: Flashcard;
  progress: CardProgress;
}

export interface ReviewResult {
  updatedProgress: CardProgress;
  nextReviewDate: Date;
}

function getStatusFromSM2(repetitions: number, interval: number): CardStatus {
  if (repetitions === 0) {
    return interval === 0 ? "new" : "relearning";
  }
  if (repetitions === 1) {
    return "learning";
  }
  if (interval >= 21) {
    return "mastered";
  }
  return "review";
}

export class StudyQueueService {
  constructor(
    private readonly cardProgressRepository: CardProgressRepository,
    private readonly flashcardRepository: FlashcardRepository
  ) {}

  /**
   * Get the next cards due for review in a deck.
   * Returns cards sorted by priority: overdue first, then by due date.
   */
  async getNextCards(
    deckId: string,
    userId: string,
    limit: number = 10
  ): Promise<StudyCard[]> {
    // Get due cards from progress repository
    const dueProgress = await this.cardProgressRepository.findDueCards(
      deckId,
      userId,
      limit
    );

    // Fetch the corresponding flashcards
    const studyCards: StudyCard[] = [];

    for (const progress of dueProgress) {
      const flashcard = await this.flashcardRepository.findById(progress.cardId);
      if (flashcard && !flashcard._tombstone) {
        studyCards.push({ flashcard, progress });
      }
    }

    return studyCards;
  }

  /**
   * Get new cards that haven't been studied yet.
   * Creates progress records for cards that don't have one.
   */
  async getNewCards(
    deckId: string,
    userId: string,
    limit: number = 10
  ): Promise<StudyCard[]> {
    // Get all flashcards in the deck
    const flashcards = await this.flashcardRepository.findByDeckId(deckId);

    // Get existing progress for this user and deck
    const existingProgress = await this.cardProgressRepository.findByDeckIdAndUserId(
      deckId,
      userId
    );

    const existingCardIds = new Set(existingProgress.map((p) => p.cardId));

    // Find cards without progress
    const newFlashcards = flashcards
      .filter((f) => !f._tombstone && !existingCardIds.has(f.id))
      .slice(0, limit);

    // Create progress for new cards
    const studyCards: StudyCard[] = [];

    for (const flashcard of newFlashcards) {
      const progress = await this.cardProgressRepository.create({
        userId,
        cardId: flashcard.id,
        deckId,
      });
      studyCards.push({ flashcard, progress });
    }

    return studyCards;
  }

  /**
   * Submit a review for a card and update its progress using SM-2.
   */
  async submitReview(
    progressId: string,
    rating: ReviewRating
  ): Promise<ReviewResult> {
    const progress = await this.cardProgressRepository.findById(progressId);

    if (!progress) {
      throw new Error(`CardProgress not found: ${progressId}`);
    }

    // Calculate next review using SM-2
    const sm2Result = calculateSM2(
      {
        easeFactor: progress.easeFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
      },
      rating
    );

    // Determine new status
    const newStatus = getStatusFromSM2(sm2Result.repetitions, sm2Result.interval);

    // Update progress
    const updatedProgress = await this.cardProgressRepository.update(progress.id, {
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      status: newStatus,
      dueDate: sm2Result.nextReviewDate,
      lastReviewedAt: new Date(),
      _version: progress._version + 1,
    });

    return {
      updatedProgress,
      nextReviewDate: sm2Result.nextReviewDate,
    };
  }

  /**
   * Get study statistics for a deck.
   */
  async getDeckStats(
    deckId: string,
    userId: string
  ): Promise<{
    total: number;
    new: number;
    learning: number;
    review: number;
    mastered: number;
    dueToday: number;
  }> {
    const allProgress = await this.cardProgressRepository.findByDeckIdAndUserId(
      deckId,
      userId
    );

    const flashcards = await this.flashcardRepository.findByDeckId(deckId);
    const activeFlashcardIds = new Set(
      flashcards.filter((f) => !f._tombstone).map((f) => f.id)
    );

    const activeProgress = allProgress.filter((p) =>
      activeFlashcardIds.has(p.cardId)
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      total: activeFlashcardIds.size,
      new: activeFlashcardIds.size - activeProgress.length,
      learning: activeProgress.filter(
        (p) => p.status === "learning" || p.status === "relearning"
      ).length,
      review: activeProgress.filter((p) => p.status === "review").length,
      mastered: activeProgress.filter((p) => p.status === "mastered").length,
      dueToday: activeProgress.filter((p) => p.dueDate <= today).length,
    };
  }
}
