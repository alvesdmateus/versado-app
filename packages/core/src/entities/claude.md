# Entities

Domain models representing core business concepts.

## Pattern

Each entity file contains:
- Interface defining the shape
- Input interface for creation
- Factory function for instantiation

```typescript
export interface Thing {
  id: string;
  name: string;
  createdAt: Date;
  // Sync fields (if syncable)
  _version: number;
  _tombstone: boolean;
}

export interface CreateThingInput {
  name: string;
}

export function createThing(input: CreateThingInput): Thing {
  return {
    id: crypto.randomUUID(),
    name: input.name,
    createdAt: new Date(),
    _version: 1,
    _tombstone: false,
  };
}
```

## Rules

- Entities are plain data; no methods, no behavior
- IDs use `crypto.randomUUID()`
- Timestamps use `Date` objects
- Factory functions handle defaults and generated fields
- Never import from `repositories/` or `services/`
- Syncable entities include `_version` and `_tombstone`

## Current Entities

| Entity | Purpose | Syncable |
|--------|---------|----------|
| `Flashcard` | Question/answer card with tags, difficulty, source | Yes |
| `Deck` | Collection with owner, visibility, settings, marketplace | Yes |
| `User` | User account with email, tier | No |
| `CardProgress` | Per-user SM-2 state (easeFactor, interval, dueDate) | Yes |
| `StudySession` | Study history with reviews and stats | No |

## Key Types

```typescript
// Flashcard
type Difficulty = "easy" | "medium" | "hard";
type CardSource = { type: "manual" } | { type: "ai" } | { type: "imported" };

// Deck
type DeckVisibility = "private" | "shared" | "public" | "marketplace";
type StudyAlgorithm = "sm2" | "fsrs";

// User
type UserTier = "free" | "premium" | "team";

// CardProgress
type CardStatus = "new" | "learning" | "review" | "relearning" | "mastered";

// StudySession
type ReviewRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
```
