# @flashcard/storage

Storage abstraction layer for offline-first data persistence.

## Structure

```
src/
  storage-adapter.ts    # Interface definition
  adapters/
    indexeddb-adapter.ts  # Browser IndexedDB implementation
```

## Pattern

Storage uses adapter pattern for swappable implementations.

```typescript
import { IndexedDBAdapter } from "@flashcard/storage/adapters";

const storage = new IndexedDBAdapter();

// CRUD operations
await storage.set("decks", deck.id, deck);
const deck = await storage.get<Deck>("decks", deckId);
await storage.delete("decks", deckId);

// Query with filters
const cards = await storage.query<Flashcard>("flashcards", {
  filters: [{ field: "deckId", operator: "eq", value: deckId }],
  orderBy: { field: "createdAt", direction: "desc" },
  limit: 20,
});

// Transactions
await storage.transaction(["decks", "flashcards"], "readwrite", async (tx) => {
  await tx.delete("decks", deckId);
  const cards = await tx.getAll<Flashcard>("flashcards");
  for (const card of cards.filter(c => c.deckId === deckId)) {
    await tx.delete("flashcards", card.id);
  }
});
```

## Collections

| Name | Entity | Indexes |
|------|--------|---------|
| `decks` | Deck | - |
| `flashcards` | Flashcard | deckId, _tombstone |
| `users` | User | - |
| `card-progress` | CardProgress | userId, deckId, cardId, dueDate |
| `study-sessions` | StudySession | userId, deckId |

## Rules

- All operations are async (Promise-based)
- `get` returns `null` if not found (not undefined)
- Transactions auto-rollback on error
- Call `close()` when done to release resources

## Future Adapters

- `MemoryAdapter` - For testing
- `SQLiteAdapter` - For Capacitor/Tauri apps
