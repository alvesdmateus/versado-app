---
version: 1
slug: "src-pages-learnhomepage-tsx"
primary_target: "src/pages/LearnHomePage.tsx"
related_targets: ["src/pages/LessonPage.tsx","src/pages/TrackDetailPage.tsx","src/pages/ReviewPage.tsx","src/layouts/AppLayout.tsx"]
---

## Scope

Skill-track learning surfaces of the Versado web app: app shell + bottom navigation, Learn home (track path), Track detail, Lesson player (4-stage, full-screen), Review (spaced prediction checks), Track selection. Mode: Operate (the lesson canvas behaves as Experience inside the Operate shell).

Audience: adult self-learners on phones in short sessions. Task: continue the next module, do due reviews, pick a track. Content: lesson specs from the API (English first); chrome translated via i18n. Constraints: bible (`intuitive_interactive_learning.md`), ≤2 controls, ≤25 words per scene, reduced-motion fallbacks, legacy flashcards kept under a Flashcards tab.

## Direction contract

THESIS: Every idea is a coloured elastic band stretched between pegs on a lattice — pulled, snapped, compared. Refuses the category default of white cards, a brand-blue progress path, streak flames and mascots.

OWN-WORLD: Frosted-acrylic ground (cool near-white, dark graphite in dark mode) with a faint peg-dot lattice wherever space is a plane; graphite ink; hairline seams (1px) instead of shadows; colour quarantined to bands: red, amber, green, blue, violet — only on the board, in symbols mapped to the board, and the active nav peg. Figtree with tabular figures; 800 display for titles. Square-ish 4–6px radii.

STORY: The learner sees exactly where they are on one band, presses Continue, moves a band themselves, commits a prediction, sees the error as a shape and a number, then sees the symbols coloured like the bands they pulled. They come back when a peg is circled.

FIRST VIEWPORT: Header (Versado wordmark left; today's minutes vs 15-min session meter right) over a hairline. 28px 800 track title + one meta line (domain · progress · due checks); no kicker. Below, a peg board fills the rest: one red band hooked peg to peg, each peg beside its lesson card (cards set the rhythm; minutes are written on the card — chosen 2026-11-13 over segment length ∝ minutes, which left most of the board empty); done pegs graphite, due reviews ringed in dashed blue, current peg large red with a hairline-bordered panel (stage, minutes, title, full-width graphite Continue); locked pegs hollow. Bottom nav: Learn · Review · Flashcards · Profile, active item marked by a red peg.

FORM: Geoboard & Bands — candidate 6 of my ordered grounded list (re-roll 1). seed:e9dc5c177975cca8. Raises: colour quarantined to the board (lexicon); segment length = duration (labanotation); session timed to fit (j-card); due reviews circled on the path (circle catalog). Signature interaction: bands stretch with a short spring overshoot and snap to pegs; wrong predictions draw the correct band dashed with the delta labelled on the shape. Motion grammar: spring settle ≤240ms, no fades for state, reduced motion = instant snap.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
