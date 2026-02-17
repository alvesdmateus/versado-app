# @flashcard/web

React frontend application built with Vite.

## Structure

```
src/
  main.tsx       # Entry point, React root
  App.tsx        # Root component
  vite-env.d.ts  # Vite type definitions
```

## Future Structure (as app grows)

```
src/
  components/    # App-specific components
  pages/         # Route pages
  hooks/         # Custom React hooks
  stores/        # State management
  repositories/  # Repository implementations
  lib/           # Utilities
```

## Dependencies

- `@flashcard/core` - Domain logic and types
- `@flashcard/ui` - Shared UI components

## Repository Implementations

This app will contain concrete repository implementations:

```typescript
// src/repositories/local-storage-deck-repository.ts
import type { DeckRepository } from "@flashcard/core/repositories";

export class LocalStorageDeckRepository implements DeckRepository {
  // Implementation using localStorage or IndexedDB
}
```

## Commands

```bash
bun run dev      # Start dev server (port 5173)
bun run build    # Production build to dist/
bun run preview  # Preview production build
```

## Path Aliases

`@/*` maps to `./src/*` for cleaner imports:

```typescript
import { MyComponent } from "@/components/MyComponent";
```
