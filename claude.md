# Flashcard App

Monorepo flashcard application — React PWA + Hono API + PostgreSQL.

## Architecture

```
apps/
  web/              # React PWA (Vite + React Router v7)
  api/              # Hono REST API (Bun + Drizzle + PostgreSQL)
packages/
  core/             # Domain entities, repositories, services
  ui/               # React components + design tokens (Tailwind v4)
  storage/          # Storage adapters (IndexedDB)
  algorithms/       # SM-2 spaced repetition
  validation/       # Zod schemas (shared client/server)
  auth/             # Auth types + constants
```

## Commands

```bash
bun run dev:web      # Start web dev server (port 5173)
bun run dev:api      # Start API server (port 3000)
bun run typecheck    # Type check all 8 packages
bun run build        # Build all packages
```

```bash
cd apps/api
bun run db:generate  # Generate Drizzle migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

Docker: `docker compose up -d` starts PostgreSQL on port 5433.

## Workspace Conventions

- Package naming: `@flashcard/<name>`, deps via `workspace:*`
- Each package has own `package.json`, `tsconfig.json`
- Barrel exports via `index.ts` in each module
- Co-located tests: `*.test.ts` alongside source

## Frontend Patterns (apps/web)

### Routing
React Router v7 with `createBrowserRouter`. Layout route wraps `AppLayout` (includes `BottomNav`). `ProtectedRoute` guard checks auth.

### Pages
| Page | Path | Purpose |
|------|------|---------|
| `HomePage` | `/` | Dashboard: streak, due cards, stats, deck carousel |
| `DecksPage` | `/decks` | Deck grid with search, filter tabs, favorites, FAB to create |
| `DeckDetailPage` | `/decks/:deckId` | Deck info, card list, study/add/edit/delete actions |
| `StudySessionPage` | `/study/:deckId` | Flip cards, rate, session complete with stats |
| `ProfilePage` | `/profile` | User info, preferences, 6 settings modals |

### API Modules (lib/)
- `api-client.ts` — Base fetch wrapper with JWT auth, token refresh, `ApiError` class
- `deck-api.ts` — `list()`, `get(id)`, `create()`, `update()`, `delete()`, `getCards()`
- `flashcard-api.ts` — `create()`, `batchCreate()`, `update()`, `delete()`
- `dashboard-api.ts` — `getStats()` returns streak, due today, accuracy, deck list
- `profile-api.ts` — `update()`, `changePassword()`, `getPreferences()`, `updatePreferences()`
- `study-api.ts` — `getDueCards()`, `submitReview()`, `startSession()`, `endSession()`

### Shared Components (components/shared/)
- `Modal` — Portal-rendered, backdrop click + Escape close, body scroll lock, sizes: sm/md/lg
- `Toast` + `ToastContext` — `showToast(msg, type?)`, auto-dismiss 3s, stacked above BottomNav
- `ConfirmDialog` — Built on Modal, danger variant for destructive actions
- `EmptyState` — Icon + title + description + optional action button
- `DropdownMenu` — Click-outside close, items with optional icon, danger variant
- `Textarea` — Styled like `Input` from `@flashcard/ui`, with `label?` and `error?`
- `Skeleton` + `DeckGridSkeleton` + `CardListSkeleton` + `HomeSkeleton` — Loading placeholders
- `ErrorBoundary` — Class component, catches render errors, shows reload screen

### UI Import Pattern
```typescript
import { Button, Input, CircularProgress } from "@flashcard/ui";
import { cn } from "@flashcard/ui";                    // clsx + tailwind-merge
import { Modal, ConfirmDialog } from "@/components/shared";
```

**Note:** `cn` is exported from main `@flashcard/ui` barrel — NOT `@flashcard/ui/lib`.

### State Pattern
- Local state via `useState` for form/UI state
- API data fetched in `useEffect` on mount
- Optimistic updates: toggle state immediately, revert on API failure
- Modal pattern: `[isOpen, setIsOpen]` state, modal rendered at bottom of JSX

### Favorites
- Stored in user preferences as `favoriteDeckIds: string[]`
- `DecksPage` loads preferences on mount, uses `Set<string>` for O(1) lookup
- Toggle sends `profileApi.updatePreferences({ favoriteDeckIds })` with optimistic UI

## Backend Patterns (apps/api)

### Stack
Hono framework, Drizzle ORM, PostgreSQL (JSONB for preferences/stats/settings).

### Auth
JWT access token (15min) + refresh token (7d with rotation). Bcrypt password hashing.
Middleware chain: CORS → rate limit → secure headers → auth → routes.

### DB Schema (Drizzle)
Tables: `users`, `refresh_tokens`, `decks`, `flashcards`, `card_progress`, `study_sessions`, `purchases`, `subscriptions`, `marketplace_reviews`.

User preferences stored as JSONB with typed shape including `favoriteDeckIds`.

### API Endpoints

**Auth (public):**
- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `GET /auth/me`

**Protected (`/api/*`):**
- Decks: `GET/POST /api/decks`, `GET/PATCH/DELETE /api/decks/:id`, `GET /api/decks/:id/cards`
- Cards: `POST /api/flashcards`, `POST /api/flashcards/batch`, `PATCH/DELETE /api/flashcards/:id`
- Study: `GET /api/study/decks/:deckId/due`, `POST /api/study/review`, sessions CRUD
- Profile: `PATCH /api/profile`, `POST /api/profile/change-password`, `GET/PATCH /api/profile/preferences`
- Dashboard: `GET /api/dashboard/stats`
- Marketplace: `GET /api/marketplace/decks`, `POST /api/marketplace/purchase`

### Validation
Shared Zod schemas in `@flashcard/validation`. API validates with `validate(schema, body)` helper. Frontend uses same schemas where applicable.

## Shared Packages

### @flashcard/algorithms
```typescript
import { calculateSM2 } from "@flashcard/algorithms";
// Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
const result = calculateSM2({ easeFactor: 2.5, interval: 6, repetitions: 2 }, 3);
```

### @flashcard/ui
Components: `Button`, `Input`, `CircularProgress`, `FlashcardView`, `ReviewButtons`, `StudyProgress`, `SessionSummary`.
Design tokens: `colors`, `spacing`, `fontSize` from `@flashcard/ui/tokens`.
Tailwind v4 with CSS custom properties for primary/neutral/success/error scales.

### @flashcard/validation
Schemas: `registerSchema`, `loginSchema`, `changePasswordSchema`, `createDeckSchema`, `updateDeckSchema`, `createFlashcardSchema`, `batchCreateFlashcardsSchema`, `updatePreferencesSchema`.

## Environment

```
# apps/api/.env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/flashcard
JWT_SECRET=<min 32 chars>
WEB_URL=http://localhost:5173
NODE_ENV=development
```

Docker Compose runs PostgreSQL on host port **5433** (5432 may be used by other projects).
