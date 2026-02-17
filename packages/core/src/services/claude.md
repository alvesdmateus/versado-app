# Services

Business logic layer orchestrating operations on entities.

## Pattern

Services receive repository dependencies via constructor injection.

```typescript
export class ThingService {
  constructor(private readonly thingRepository: ThingRepository) {}

  async getThing(id: string): Promise<Thing | null> {
    return this.thingRepository.findById(id);
  }

  async createThing(input: CreateThingInput): Promise<Thing> {
    // Add business logic here (validation, events, etc.)
    return this.thingRepository.create(input);
  }
}
```

## Rules

- Constructor injection for dependencies
- Dependencies are `private readonly`
- Methods mirror repository but add business logic
- Throw domain errors for business rule violations
- Keep services focused; split when they grow

## When to Add Logic

Services are where you add:
- Validation beyond type checking
- Business rules and constraints
- Cross-entity operations
- Event emission
- Caching strategies

## Current Services

| Service | Repository | Purpose |
|---------|------------|---------|
| `DeckService` | `DeckRepository` | Deck CRUD operations |
| `FlashcardService` | `FlashcardRepository` | Flashcard CRUD operations |

## Phase 2: StudyQueueService (To Be Created)

```typescript
// packages/core/src/services/study-queue-service.ts

import type { CardProgressRepository } from "../repositories/card-progress-repository";
import type { FlashcardRepository } from "../repositories/flashcard-repository";
import type { ReviewRating } from "../entities/study-session";
import { calculateSM2 } from "@flashcard/algorithms";

export class StudyQueueService {
  constructor(
    private readonly cardProgressRepository: CardProgressRepository,
    private readonly flashcardRepository: FlashcardRepository
  ) {}

  /**
   * Get next cards to study, prioritized by:
   * 1. Learning cards (short intervals)
   * 2. Due review cards
   * 3. New cards (up to daily limit)
   */
  async getNextCards(userId: string, deckId: string, limit: number = 20) {
    // Implementation
  }

  /**
   * Process a review and update card progress using SM-2
   */
  async submitReview(userId: string, cardId: string, rating: ReviewRating) {
    // 1. Get current progress
    // 2. Calculate new SM-2 values
    // 3. Update progress in repository
  }
}
```

### Dependencies Needed

1. **CardProgressRepository** (to be created in repositories/)
   - `findByUserAndCard(userId, cardId)`
   - `findDueCards(userId, deckId, dueDate)`
   - `findNewCards(userId, deckId, limit)`
   - `update(id, data)`

2. **@flashcard/algorithms** package
   - `calculateSM2(card, rating)` function
