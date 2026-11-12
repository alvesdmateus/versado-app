# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Mobile-first PWA, also shipped to Android through a Trusted Web Activity (`versado-android/`). The design language is web, not native Android.

## Users

Adult self-learners: professionals and curious people who want to *understand* mathematics, software development and science, not just memorize them. They study on their phones in short sessions (commute, breaks), often after a long gap since school.

## Product Purpose

Versado teaches skills through **tracks**: ordered sequences of short interactive modules grounded in cognitive science. Success means the learner builds a durable intuition (they can predict an outcome before seeing it) and keeps it through spaced, interleaved review.

The first track is **Algebra through Geometry** (mathematics): algebra taught visually and experimentally first, using shapes and analytic geometry (the coordinate plane) before any notation.

## Positioning

Every module follows the 4-stage blueprint in `intuitive_interactive_learning.md` (repo root, the product bible): visual anchoring with no jargon → direct manipulation with instant causal feedback → a mandatory prediction gate → color-mapped symbolic formalization. Feedback is diagnostic (it shows the visual discrepancy), never a generic "Correct/Incorrect".

## Operating Context

- One-handed phone use in short sessions of 15–30 second micro-scenes; a module takes about 3–5 minutes.
- Spaced prediction checks come back at +24h / +7d (SM-2 scheduling) and mix problem types.
- Lesson content (specs, prompts, targets) is stored in the database and served by the API; interactives are client components keyed by `module.interactive`.

## Capabilities and Constraints

- Stack: React 19 + React Router v7 + Tailwind v4 (`apps/web`), Hono API, PostgreSQL (local Docker in dev, pluggable provider in prod).
- UI chrome is translated (en, pt, es, fr, de via react-i18next). Lesson content is authored **in English first**; translations come later.
- Cognitive-load budget per scene: at most 2 manipulable variables, ~25 on-screen words, labels anchored to what they describe.
- The legacy flashcard system (decks, SM-2 study, community/marketplace, exams) is preserved as "Flashcards (custom)" but is no longer the core loop.
- Undecided: how flashcards will feed track reviews; monetization of tracks.

## Brand Commitments

- Name **Versado** and the logo (`apps/web/public/favicon.svg`) are fixed.
- Everything else in the visual identity (typeface, palette, components) may be redesigned for the new purpose.

## Evidence on Hand

- `intuitive_interactive_learning.md` — the instructional-design bible (Sweller, Mayer, Chi & Wylie, Dunlosky, Roediger & Karpicke).
- Math track content: `apps/api/src/content/math-algebra-geometry.ts`.
- No testimonials, learner metrics, or outcome data exist yet; do not fabricate any.

## Product Principles

1. **Intuition before notation.** Symbols arrive last and are color-matched to what the learner already moved.
2. **Do, then predict, then see.** The learner commits to a prediction before any reveal.
3. **Show the error, don't grade it.** Wrong answers become visible differences the learner can fix.
4. **Less on screen.** Every word, control and decoration competes with working memory.
5. **Come back to it.** Retention is designed in through spaced, interleaved prediction checks.

## Accessibility & Inclusion

- Respect `prefers-reduced-motion`: anchoring animations must have a static, equally informative fallback.
- Every manipulable control has a keyboard/screen-reader equivalent (native range inputs).
- Color-coding is never the only cue: color-mapped symbols are also labelled or positioned.
