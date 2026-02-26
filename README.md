<div align="center">

<img src="apps/web/public/favicon.svg" width="80" height="80" alt="Versado logo" />

# Versado

**Study smarter with spaced repetition**

A full-stack flashcard PWA built with React, Hono, and PostgreSQL — featuring the SM-2 algorithm, offline support, and a marketplace for sharing decks.

[**Try it live →**](https://versado.live)

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Features

- **Spaced Repetition (SM-2)** — Cards are scheduled based on how well you know them, optimizing long-term retention
- **Progressive Web App** — Install on any device, works offline with background sync
- **Deck Marketplace** — Browse, purchase, and share community-created decks
- **AI Card Generation** — Generate flashcards from topics using OpenAI
- **Study Sessions** — Track streaks, accuracy, and review history with detailed stats
- **Google OAuth + Email Auth** — Sign in with Google or email/password with verification
- **Dark Mode** — Respects system preference with manual toggle
- **Push Notifications** — Get reminders when cards are due for review

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router v7, Tailwind CSS v4, Vite |
| **Backend** | Hono, Drizzle ORM, Bun runtime |
| **Database** | PostgreSQL (JSONB for flexible data) |
| **Auth** | JWT (access + refresh tokens), Google OAuth, bcrypt |
| **Payments** | Stripe (subscriptions + one-time purchases) |
| **Email** | Resend (transactional emails) |
| **Testing** | Bun test runner, Playwright (E2E) |
| **Deployment** | Vercel (web), Render (API), Neon (DB) |

## Architecture

```
versado/
├── apps/
│   ├── web/              # React PWA (Vite + React Router v7)
│   └── api/              # Hono REST API (Bun + Drizzle)
├── packages/
│   ├── core/             # Domain entities, repositories, services
│   ├── ui/               # Shared React components + design tokens
│   ├── algorithms/       # SM-2 spaced repetition engine
│   ├── validation/       # Zod schemas (shared client & server)
│   ├── auth/             # Auth types + constants
│   ├── storage/          # IndexedDB adapters (offline)
│   └── sync/             # Offline sync engine
└── e2e/                  # Playwright end-to-end tests
```

The project is organized as a **Bun monorepo** with shared packages. The frontend and backend share validation schemas, auth types, and domain models — keeping business logic consistent across the stack.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1+
- [Docker](https://www.docker.com/) (for PostgreSQL)

### Setup

```bash
# Clone the repository
git clone https://github.com/mateusmenesesDev/versado.git
cd versado

# Install dependencies
bun install

# Start PostgreSQL
docker compose up -d

# Run database migrations
cd apps/api && bun run db:migrate && cd ../..

# Start development servers
bun run dev:api   # API on http://localhost:3000
bun run dev:web   # Web on http://localhost:5173
```

### Environment Variables

Copy the example and fill in your values:

```bash
# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/versado
JWT_SECRET=your-secret-key-at-least-32-characters
WEB_URL=http://localhost:5173
NODE_ENV=development

# Optional integrations
STRIPE_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Scripts

```bash
bun run dev:web       # Start web dev server
bun run dev:api       # Start API server
bun run build         # Build all packages
bun run typecheck     # Type-check all packages
bun run test          # Run all tests
bun run test:e2e      # Run Playwright E2E tests
```

## License

MIT

