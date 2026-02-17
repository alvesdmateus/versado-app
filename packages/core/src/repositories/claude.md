# Repositories

Data access interfaces defining contracts for persistence.

## Pattern

Repository interfaces define CRUD operations without implementation details.

```typescript
export interface ThingRepository {
  findById(id: string): Promise<Thing | null>;
  findAll(): Promise<Thing[]>;
  create(input: CreateThingInput): Promise<Thing>;
  update(id: string, data: Partial<Thing>): Promise<Thing>;
  delete(id: string): Promise<void>;
}
```

## Rules

- Interfaces only; no implementations here
- All methods return Promises (async-first)
- `findById` returns `null` when not found (not undefined, not throw)
- `create` accepts input type, returns full entity
- `update` accepts partial data for flexibility
- `delete` returns void (idempotent)

## Implementations

Concrete implementations live outside this package:
- `@flashcard/storage` provides IndexedDB-based implementations
- Future `apps/api` may use PostgreSQL, MongoDB, etc.

This separation allows swapping storage without changing business logic.

## Current Repositories

| Interface | Entity |
|-----------|--------|
| `FlashcardRepository` | `Flashcard` |
| `DeckRepository` | `Deck` |

## Phase 2: CardProgressRepository (To Be Created)

```typescript
// packages/core/src/repositories/card-progress-repository.ts

import type { CardProgress, CreateCardProgressInput } from "../entities/card-progress";

export interface CardProgressRepository {
  // Standard CRUD
  findById(id: string): Promise<CardProgress | null>;
  create(input: CreateCardProgressInput): Promise<CardProgress>;
  update(id: string, data: Partial<CardProgress>): Promise<CardProgress>;
  delete(id: string): Promise<void>;

  // Study-specific queries
  findByUserAndCard(userId: string, cardId: string): Promise<CardProgress | null>;
  findByUserAndDeck(userId: string, deckId: string): Promise<CardProgress[]>;
  findDueCards(userId: string, deckId: string, beforeDate: Date): Promise<CardProgress[]>;
  findNewCards(userId: string, deckId: string, limit: number): Promise<CardProgress[]>;
  findLearningCards(userId: string, deckId: string): Promise<CardProgress[]>;
}
```

### Query Methods Explained

| Method | Purpose |
|--------|---------|
| `findDueCards` | Cards where `dueDate <= beforeDate` and `status = 'review'` |
| `findNewCards` | Cards where `status = 'new'`, limited by daily new card setting |
| `findLearningCards` | Cards where `status = 'learning'` or `'relearning'` |
| `findByUserAndCard` | Get or create progress for a specific card |
