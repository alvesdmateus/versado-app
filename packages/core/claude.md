# @flashcard/core

Domain layer containing business logic, entities, and data contracts.

## Structure

```
src/
  entities/      # Domain models and factory functions
  repositories/  # Data access interfaces (contracts)
  services/      # Business logic orchestration
```

## Principles

- **Framework agnostic**: No React, no database drivers
- **Pure TypeScript**: Runs anywhere (browser, Node, Bun)
- **Dependency Inversion**: Services depend on repository interfaces

## Import Pattern

```typescript
// Full package
import { Flashcard, FlashcardService } from "@flashcard/core";

// Subpath (more specific)
import { Flashcard } from "@flashcard/core/entities";
import { FlashcardRepository } from "@flashcard/core/repositories";
```

## Adding New Domains

1. Create entity in `entities/`
2. Create repository interface in `repositories/`
3. Create service in `services/`
4. Export from respective `index.ts` files
