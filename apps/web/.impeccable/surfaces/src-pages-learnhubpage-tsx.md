---
version: 1
slug: "src-pages-learnhubpage-tsx"
primary_target: "src/pages/LearnHubPage.tsx"
related_targets: ["src/pages/TrackPage.tsx","src/pages/ChapterPage.tsx","src/pages/LessonPage.tsx","src/pages/ReviewPage.tsx","src/layouts/AppLayout.tsx"]
---

## Scope

Skill-track learning surfaces of the Versado web app: app shell + bottom navigation, the Learn hub (`/`, every available track grouped by domain), the course page (`/tracks/:trackId`, chapters in order), the chapter page (`/tracks/:trackId/chapters/:chapterId`, the peg path), the Lesson player (4-stage, full-screen), Review (spaced prediction checks) and Track selection. Mode: Operate (the lesson canvas behaves as Experience inside the Operate shell).

Audience: adult self-learners on phones in short sessions. Task: continue the current lesson, see every track on offer, do due reviews. Content: tracks, chapters and lessons from the API (English first); chrome translated via i18n. Constraints: bible (`intuitive_interactive_learning.md`), ≤2 controls, ≤25 words per scene, reduced-motion fallbacks, legacy flashcards kept under a Flashcards tab. Domains with no published track still show, marked as on the way.

## Direction contract

THESIS: Every idea is a coloured elastic band stretched between pegs on a lattice — pulled, snapped, compared. Refuses the category default of white cards, a brand-blue progress path, streak flames and mascots.

OWN-WORLD: Frosted-acrylic ground (cool near-white, dark graphite in dark mode) with a faint peg-dot lattice wherever space is a plane; graphite ink; hairline seams (1px) instead of shadows; colour quarantined to bands: red, amber, green, blue, violet — only on the board, in symbols mapped to the board, in a track's own glyph, and the active nav peg. Figtree with tabular figures; 800 display for titles. Square-ish 4–6px radii.

STORY: The learner opens Learn and sees every track the app offers, grouped by domain, with the one in progress already open: one press on Continue drops them into the next lesson. From a track they walk down to its chapters and the chapter's peg path; in a lesson they move a band, commit a prediction, see the error as a shape and a number, then the symbols coloured like the bands they pulled. They come back when a check is due.

FIRST VIEWPORT: Header (Versado wordmark left; today's minutes vs the 15-min session meter right) over a hairline. 28px 800 "Learn" title + one meta line (track count · due checks as a blue link); no kicker. Below, one Peg Divider per domain (Mathematics, Software development, Science — the order is the product's). The track in progress opens in place into the current-module panel (1px ink border: glyph, title, next lesson · minutes, 4px rail, full-width graphite Continue, "See the whole path" link); other tracks are seam-divided rows (glyph, title, subtitle, progress caption with due pill, rail, chevron); an empty domain shows a dashed mute glyph and "Tracks on the way". Bottom nav: Learn · Review · Flashcards · Profile, active item marked by a red peg.

FORM: Geoboard & Bands — candidate 6 of my ordered grounded list (re-roll 1). seed:e9dc5c177975cca8. Raises: colour quarantined to the board (lexicon); session timed to fit (j-card); due reviews circled on the path (circle catalog). Signature interaction: bands stretch with a short spring overshoot and snap to pegs; wrong predictions draw the correct band dashed with the delta labelled on the shape. Motion grammar: spring settle ≤240ms, no fades for state, reduced motion = instant snap.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
