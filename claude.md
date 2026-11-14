# Versado

Interactive learning app for **skill tracks** (mathematics, software development, science, …),
built on cognitive science. Monorepo — React PWA + Hono API + PostgreSQL.

## IMPORTANT — The Learning Bible

@intuitive_interactive_learning.md

`intuitive_interactive_learning.md` (repo root) is the **source of truth** for product, instructional
design and UI decisions. Every lesson, screen, navigation change and feature must comply with it.
When a request conflicts with it, point out the conflict before implementing.

Non-negotiables (summary — the file wins on any detail):

- **4-stage lesson blueprint:** Anchoring (visual, zero jargon) → Guided exploration (1–2 controls,
  60fps causal feedback) → Prediction gate (commit before reveal) → Symbolic formalization (color-mapped).
- **Cognitive load:** max 2 simultaneous variables, ~25 on-screen words per scene, labels anchored to
  the elements they describe (no detached legends), 15–30s micro-scenes.
- **ICAP:** aim for Constructive/Interactive; passive content < 10s. Feedback is **diagnostic**
  (show the visual discrepancy), never a generic "Correct/Incorrect".
- **Retention:** retrieval before fluency; spaced + interleaved review of mastered concepts.
- Every new module is specified with the **YAML module template** before UI implementation and
  passes the **pre-production checklist** before shipping.

## Product Direction

Versado is moving **from a flashcard app to skill-track learning**. A track (e.g. Math, Software
Development, Science) is a sequence of interactive modules following the bible. Flashcards are no
longer the core loop; the existing flashcard system is **preserved** (see Legacy) and will later be
repurposed — most likely as the spaced-review / retrieval layer (`retention_hooks`) of tracks.

Principles for the refactor:

- The primary navigation serves learning a track; features that don't serve that (social feed,
  marketplace/community, creator discovery, upsell-first screens) are demoted or removed from the
  main flow — not deleted — until re-evaluated against the bible.
- Don't delete flashcard code, tables or endpoints without explicit approval.
- Motion is functional, not decorative: animation exists to show cause and effect, anchor intuition
  (Stage 1) or confirm a state change. Respect `prefers-reduced-motion`.

## Skill-Track Learning (core loop)

- **Domain (`packages/core/src/learning/`):** Course (`LearningTrack`; track = course in code/API) →
  ordered `LearningChapter`s → ordered `LearningModule`s (lessons; spec = the bible's YAML template as data)
  → per-user `ModuleProgress` (stage 1–4, prediction attempts, SM-2 review state).
  `LearningService` holds the rules (unlock by previous/prerequisites, mandatory correct prediction before
  completion, first review +24h then SM-2). Storage is pluggable through `LearningRepositories` ports:
  `createMemoryLearningRepositories()` (tests/dev) and the Drizzle adapter `apps/api/src/repositories/`.
- **Schemas (`packages/validation/src/learning.ts`):** `moduleSpecSchema` enforces the bible as hard limits
  (≤2 controls, ≤25-word budget, ≤12-word prompts, anchoring ≤10s). Content that breaks it cannot be seeded.
- **Content:** authored in `apps/api/src/content/*.ts` (English first): `mathematics.ts` exports the
  Mathematics course, Algebra chapter and its 11 lessons; `vectors.ts` the Vectors & matrices chapter
  (point → vector → vector sum → matrix stretch → matrix columns; opens after the first lesson). Sources nest `{ track, chapters: [{ chapter, modules }] }`;
  the loader validates parents and returns chapters plus flat ordered modules. Validated by `content.test.ts`,
  upserted track → chapters → modules with `bun run db:seed-learning` (also in `start:prod`). Tables:
  `learning_tracks`, `learning_chapters`, `learning_modules`, `module_progress` (`0011_skill_tracks`;
  `0012_course_chapters` moves existing modules/preferences without changing module ids or progress).
- **API:** `/api/learn/tracks`, `/tracks/:id`, `/modules/:id`, `POST /modules/:id/progress`,
  `GET /reviews/due`, `POST /modules/:id/review`.
- **Web:** `/` Learn hub (every track grouped by domain under `PegDivider`s; the active track opens into a Continue panel),
  `/tracks/:trackId` (course: chapters in order, one `PegDivider` each; the current chapter opens into Continue),
  `/tracks/:trackId/chapters/:chapterId` (the chapter's peg path), `/tracks/:trackId/chapters/:chapterId/lessons/:lessonId`
  (full-screen 4-stage lesson; exits back to its chapter; build URLs with `lib/learn-routes.ts`; legacy `/learn/:moduleId` redirects),
  `/review` (spaced, interleaved prediction checks), `/select-track`. Interactives live in
  `apps/web/src/components/learning/interactives/` and are keyed by `module.interactive`
  (`InteractiveDefinition`: Board, initialValues, predictionControls, solve, evaluate, formatDelta).
- **Interactives:** `area-product`, `binomial-square`, `complete-square` (x² + the whole strip b in the prediction;
  it splits and wraps on reveal; named misses "whole", "linear", "half"), `slope-intercept` (modes by exposed controls: m | c | m+c),
  `parabola` (a | h+k | b+c | k-only roots view), `line-intersection`, `line-pair` (fixed line + moving m2/b2; predict 0 / 1 / endless crossings from the stubs;
  "alwaysOne", "endless", "sameLine", "crosses"; `ControlDef.choiceLabels` for word answers), `plane-point` (x, y address),
  `vector-move` (dx, dy from a start; names "position" = gave the destination's address),
  `vector-path` (two moves tip to tail + shortcut; "partial"), `matrix-transform` (stretch: a+d on an F flag |
  columns: lean the up arrow, predict a point's image with a marker; "swap", "unmoved", "transpose").
  Chapter 2 extension boards (lessons still draft; contracts in the `vectors.ts` header): `matrix-turn` (quarter turns;
  "clockwise", "swap"), `matrix-order` (stretch/turn order; "reversed"), `matrix-area` (diagonal a·d signed area | collapse angle;
  "unsigned", "thin", "perpendicular"), `matrix-inverse` (rewind + undo stretches; "negate", "same", "subtract"),
  `matrix-system` (input x so Ax hits the pin; "destination"), `matrix-eigenvector` (probe angle; "sideways").
  `solve`/`evaluate` receive the spec (mode + `fixed`). Shared `Arrow` lives in `board-kit.tsx`.
- **Control pattern (axis rails, app-wide):** a variable that moves something along a board axis is a
  rail drawn by the board in its own coordinates — horizontal for x, vertical for y — with the thumb
  level with the element it moves (`interactives/rail.tsx`: `AxisRail`/`Rails`, `svgPoint` for pointer →
  board coordinates). Bind it in `InteractiveDefinition.axes`; boards reserve a fixed `gutter` so they
  never resize between stages. Parameters with no axis position (slope, curvature, totals) stay
  `BandSlider`s under the board. Boards receive every active control in `BoardProps.input` and also
  offer **in-plane handles** for the same variables (`PlaneHandle` on vertices/intercepts, `DragArea`
  on lines and curves, via `useBoardInput` which snaps and respects locks); rails stay the keyboard path.
  A computed result the learner predicts is a **multiple choice** (`ControlDef.choices` → `ChoiceGrid`),
  not a slider; build wrong options from named misconceptions so feedback stays diagnostic.
- **Building blocks first:** `stage2Exploration.fixed` holds parameters constant so one idea is explored alone
  (e.g. slope with c = 0, then intercept with m = 1) before modules combine them.
- **Practice (optional `spec.practice`):** faded worked examples after formalization —
  guided → assisted (`presetControls` locked at their solved value) → autonomous; the schema forbids
  adding help back. `adaptiveFeedback.onSignError` names direction mistakes the interactive detects.
- **Adding a module:** write its spec in content (YAML template fields) → add or reuse an interactive →
  run `bun test` in `apps/api/src/content` → seed. Pass the bible's pre-production checklist.
- **Visual world:** "Geoboard & Bands" — see `apps/web/PRODUCT.md`, `apps/web/DESIGN.md` and the
  direction contract in `apps/web/.impeccable/surfaces/`. Tokens: `--color-gb-*`, `--color-band-*`, `.gb-*`
  classes in `apps/web/src/index.css`. Colour lives only on the board; chrome is graphite on frosted white.

## Skills for this project

- **impeccable** — required for UI work: design/redesign of screens, `animate` for in-app motion and
  micro-interactions, and an **audit of every new or refactored screen** before it is considered done.
  `DESIGN.md` (when present) is the design-system record.
- **video-shotcraft / lemo-opuscar** — Remotion/coded motion-graphics *videos* (lesson explainers,
  Stage-1 anchoring clips, promos). Not for interactive in-app components.
- **graphify** — use for codebase questions when `graphify-out/` exists.

## Deployment & Infrastructure

- **Web:** Vercel (React PWA) · **API:** Render (Hono/Bun) · **DB:** Neon (serverless PostgreSQL)
- **Target:** Mobile-first PWA → Android TWA on Google Play Console (`versado-android/`)

## Architecture

```
apps/
  web/              # React PWA (Vite + React Router v7)
  api/              # Hono REST API (Bun + Drizzle + PostgreSQL)
packages/
  core/             # Domain entities, repositories, services, tracks (src/tracks.ts)
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
bun run typecheck    # Type check all packages
bun run build        # Build all packages
```

```bash
cd apps/api
bun run db:generate  # Generate Drizzle migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

Docker: `docker compose up -d` starts PostgreSQL on port **5433** (5432 may be used by other projects).

## Workspace Conventions

- Package naming: `@versado/<name>`, deps via `workspace:*`
- Each package has own `package.json`, `tsconfig.json`
- Barrel exports via `index.ts` in each module
- Co-located tests: `*.test.ts` alongside source

## Frontend Patterns (apps/web)

- **Routing:** React Router v7 `createBrowserRouter` (`src/router.tsx`). Layout route wraps `AppLayout`
  (includes `BottomNav`); `ProtectedRoute` guards auth. `AppLayout` redirects new users to
  `/select-track`. Bottom nav: Learn · Review · Flashcards · Profile.
- **Legacy flashcard tracks:** `packages/core/src/tracks.ts` (`TRACKS`) / `useTrack()` — the web app now always
  runs them as `custom`; CKA/AWS/DevOps are no longer offered. Skill tracks use `activeLearningTrackId`.
- **i18n:** `react-i18next`, 5 languages — never hardcode user-facing strings.
- **UI imports:**
  ```typescript
  import { Button, Input, CircularProgress } from "@versado/ui";
  import { cn } from "@versado/ui";                    // NOT @versado/ui/lib
  import { Modal, ConfirmDialog } from "@/components/shared";
  ```
- **Shared components (components/shared/):** `Modal`, `Toast`/`ToastContext` (`showToast`),
  `ConfirmDialog`, `EmptyState`, `DropdownMenu`, `Textarea`, `Skeleton` variants, `ErrorBoundary`.
- **State:** local `useState`; API data fetched in `useEffect`; optimistic updates with revert on
  failure; modals as `[isOpen, setIsOpen]` rendered at the bottom of JSX.

## Backend Patterns (apps/api)

- Hono + Drizzle ORM + PostgreSQL (JSONB for preferences/stats/settings).
- **Auth:** JWT access (15min) + refresh (7d, rotation), bcrypt, Google OAuth.
  Middleware chain: CORS → rate limit → secure headers → auth → routes.
- **Validation:** shared Zod schemas in `@versado/validation`; API uses `validate(schema, body)`.
- Payments: Stripe (subscriptions + purchases). Email: Resend.

## Legacy: Flashcard System (preserved)

Kept working and untouched unless a task says otherwise; to be repurposed later.

- **Pages:** `HomePage` (now `/flashcards`), `DecksPage` (/decks), `DeckDetailPage` (/decks/:deckId),
  `StudySessionPage` (/study/:deckId), `ExamPage` (/exam), `StudyHistoryPage`, `StudyStatsPage`,
  `DiscoverPage`, `CommunityPage`/`CommunityDetailPage`, `FluentPage`, `BillingPage`.
- **API modules (web lib/):** `deck-api`, `flashcard-api`, `study-api`, `dashboard-api`,
  `profile-api`, `marketplace-api`.
- **Endpoints:** decks (`/api/decks…`), cards (`/api/flashcards…`), study (`/api/study…`),
  dashboard (`/api/dashboard/stats`), marketplace (`/api/marketplace…`), profile (`/api/profile…`).
- **DB tables:** `users`, `refresh_tokens`, `decks`, `flashcards`, `card_progress`, `study_sessions`,
  `purchases`, `subscriptions`, `marketplace_reviews`.
- **SM-2:** `calculateSM2({ easeFactor, interval, repetitions }, rating)` from `@versado/algorithms`
  (1=Again, 2=Hard, 3=Good, 4=Easy) — candidate engine for the bible's spaced-review hooks.
- Favorites: `favoriteDeckIds: string[]` in user preferences.

## Environment

```
# apps/api/.env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/versado
JWT_SECRET=<min 32 chars>
WEB_URL=http://localhost:5173
NODE_ENV=development
```

## Version Control

- **GitHub Flow:** `main` always deployable; branches `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`,
  `test/`, `ci/` in lowercase kebab-case.
- **Squash merge only**; PR title becomes the commit on `main`; head branches auto-delete.
- **PR title (Conventional Commits, CI-enforced):** `<type>(<scope>): <description>`, subject lowercase.
  Types: `feat`, `fix`, `perf`, `docs`, `chore`, `refactor`, `test`, `style`, `ci`.
  Scopes: `api`, `web`, `core`, `ui`, `algorithms`, `auth`, `storage`, `sync`, `validation`, `e2e`,
  `deps`, `ci`, `main`.
- **Semver:** `feat` → minor, `fix`/`perf` → patch, others none, `feat!`/`BREAKING CHANGE:` → major.
- **release-please** manages versions, changelog, tags (`versado-vX.Y.Z`); workspace versions stay in sync.
- **Branch protection (`main`):** PR required; checks: Type Check, Unit Tests, API Integration Tests,
  Component Tests, E2E Tests, Validate PR Title; up to date before merge; conversations resolved.
