<div align="center">

<img src="apps/web/public/favicon.svg" width="80" height="80" alt="Versado logo" />

# Versado

**Study smarter with spaced repetition**

A full-stack flashcard PWA featuring the SM-2 algorithm, offline support, a deck marketplace, and AI-powered card generation.

<br />

<a href="https://versado.live">
  <img src="https://img.shields.io/badge/%F0%9F%9A%80_Try_Versado_Live-3b82f6?style=for-the-badge&logoColor=white" alt="Try Versado Live" height="40" />
</a>

<br />
<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

</div>

---

## What is Versado?

Versado is a **flashcard study app** that helps you learn and retain anything using scientifically-backed spaced repetition. Create your own decks, discover community decks in the marketplace, or let AI generate cards for you — then study on any device, even offline.

## Features

**Study & Learning**
- **Spaced Repetition (SM-2)** — Cards are automatically scheduled based on how well you know them, optimizing long-term memory retention
- **Study Sessions** — Track your learning streaks, accuracy, and review history with detailed statistics on your dashboard
- **AI Card Generation** — Describe a topic and let AI create flashcards for you instantly
- **Push Notifications** — Get reminded when cards are due so you never break your streak

**Social & Discovery**
- **Deck Marketplace** — Browse, rate, and purchase community-created decks across categories
- **Deck Publishing** — Share your own decks with the community and earn from purchases

**App Experience**
- **Progressive Web App** — Install on your phone, tablet, or desktop — works like a native app
- **Offline Support** — Study anywhere without an internet connection, changes sync when you're back online
- **Dark Mode** — Automatic system preference detection with manual toggle
- **Google OAuth + Email Auth** — Quick sign-in with Google, or classic email/password with email verification

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router v7, Tailwind CSS v4, Vite |
| **Backend** | Hono, Drizzle ORM, Bun runtime |
| **Database** | PostgreSQL with JSONB |
| **Auth** | JWT with refresh token rotation, Google OAuth, bcrypt |
| **Payments** | Stripe (subscriptions + marketplace purchases) |
| **Email** | Resend (transactional emails) |
| **Testing** | Bun test runner, Playwright E2E |
| **Deployment** | Vercel (web), Render (API), Neon (database) |

## Architecture

The project is a **Bun monorepo** with shared packages — the frontend and backend share validation schemas, auth types, and domain models, keeping business logic consistent across the entire stack.

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

## License

MIT

