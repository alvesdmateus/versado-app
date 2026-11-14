---
name: Versado
description: Skill tracks taught on a peg board, where every idea is a coloured band you stretch, predict, and see snap.
colors:
  gb-ground: "#eef1f4"
  gb-panel: "#f8fafb"
  gb-ink: "#1b1e23"
  gb-mute: "#56606b"
  gb-seam: "#d3d9e0"
  gb-peg: "#aeb8c3"
  band-red: "#c92a2e"
  band-amber: "#985107"
  band-emerald: "#166b51"
  band-blue: "#3a6ea5"
  band-violet: "#7b5ea7"
  band-rose: "#b83466"
  band-slate: "#5d6773"
typography:
  display:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\" 1"
  headline:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    lineHeight: 1.25
  wordmark:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    fontFeature: "\"tnum\" 1"
  caption:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  board-tag:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    fontFeature: "\"tnum\" 1"
  board-tick:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    fontFeature: "\"tnum\" 1"
rounded:
  control: "5px"
  panel: "6px"
  rail: "2px"
  peg: "9999px"
spacing:
  lattice: "28px"
  gutter: "20px"
  gutter-lesson: "16px"
  stack-sm: "8px"
  stack-md: "12px"
  stack-lg: "16px"
  stack-xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.gb-ink}"
    textColor: "{colors.gb-ground}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
    width: "100%"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.gb-ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-stepper:
    backgroundColor: "transparent"
    textColor: "{colors.gb-ink}"
    rounded: "{rounded.control}"
    size: "44px"
  board-panel:
    backgroundColor: "{colors.gb-ground}"
    rounded: "{rounded.panel}"
    padding: "8px"
  current-module-panel:
    backgroundColor: "{colors.gb-panel}"
    textColor: "{colors.gb-ink}"
    rounded: "{rounded.panel}"
    padding: "16px"
  bottom-nav:
    backgroundColor: "{colors.gb-panel}"
    textColor: "{colors.gb-mute}"
    height: "64px"
  bottom-nav-active:
    textColor: "{colors.gb-ink}"
  stage-rail:
    backgroundColor: "{colors.gb-seam}"
    rounded: "{rounded.peg}"
    height: "4px"
  stage-rail-current:
    backgroundColor: "{colors.band-red}"
  stage-rail-done:
    backgroundColor: "{colors.gb-ink}"
  due-badge:
    backgroundColor: "{colors.band-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.peg}"
---

# Design System: Versado

## Overview

**Creative North Star: "Geoboard & Bands"**

Every idea is a coloured elastic band stretched between pegs on a lattice: pulled, snapped, compared. The skill-track surfaces (Learn, Track, Lesson, Review, Track selection, and the app shell's bottom nav) sit on a frosted-acrylic ground, cool near-white in light mode and dark graphite in dark mode, with a faint peg-dot lattice wherever space behaves like a plane. Everything that is not the board is graphite ink on that ground, separated by 1px hairline seams. Colour is reserved for the bands, for the symbols mapped to them, and for the single red peg that marks where you are.

Density is low and deliberate: one prompt, one board, at most two controls, one action. The board is the content; chrome stays quiet and monochrome so that a band's colour always means something. Motion is physical rather than decorative: shapes settle onto pegs with a short spring overshoot, and a wrong prediction draws the missing piece as a dashed, marching band with the difference written on the shape.

This world deliberately refuses the category default of white cards on blue, a brand-blue progress path, streak flames, and mascots. The legacy flashcard surfaces (`/flashcards`, Decks, Study, Community, Exams and the rest) still run on the older blue Nunito-era Tailwind scales (`primary-*`, `neutral-*`, `success-*`, `warning-*`, `error-*`, `--shadow-card*`). They are legacy, outside this world, and nothing in this document describes them.

**Key Characteristics:**
- Frosted ground plus 28px peg lattice; graphite ink; 1px seams instead of shadows.
- Colour lives only on the board, in symbols mapped to the board, and in two chrome signals (the active red nav peg, blue for "due").
- Figtree throughout, 800 for titles, tabular figures everywhere numbers appear.
- Square-ish corners: 5px controls, 6px panels; pegs and rails fully round.
- Signature motion: 240ms spring snap; instant snap under reduced motion.

## Colors

A graphite-on-acrylic neutral set carrying a quarantined family of seven band colours, each retuned brighter for the dark ground.

### Primary
- **Signal Red** (band-red): the board's own band. It marks the current position (current peg, current stage segment, the learner's path band up to now, the active nav peg) and errors (miss prompts, missing-piece outlines, delta labels, finish errors). Never decorative.

### Secondary
- **Due Blue** (band-blue): content band, and the one meaning colour allowed in chrome besides red: due reviews (dashed ring around a peg, the "N checks due" link, the nav badge), plus focus rings and text selection.
- **Correct Emerald** (band-emerald): content band; also the fill for the correct or target area on area boards.

### Tertiary
- **Band Amber, Band Violet, Band Rose, Band Slate**: content bands assigned per variable by the lesson spec (`colorToken`). Slate is the neutral band for controls that do not name a coloured quantity (for example "Total area", a marker). Areas use the same band as a translucent fill (22 to 45% `color-mix` with transparent), never a new hue.

### Neutral
- **Frosted Ground** (gb-ground): page and board ground, also the knockout stroke behind board labels.
- **Acrylic Panel** (gb-panel): raised-by-tone surfaces: bottom nav, the current-module panel, slider thumbs.
- **Graphite Ink** (gb-ink): text, primary button fill, done pegs and the done path band, rectangle outlines.
- **Graphite Mute** (gb-mute): secondary text, meta lines, tick labels, guide dashes, inactive nav.
- **Hairline Seam** (gb-seam): every border and divider, axes, empty rail segments, slider track.
- **Peg Grey** (gb-peg): lattice dots, locked-peg strokes, scrollbar thumb.

Dark mode (`.dark`) redefines the same tokens: ground #14171c, panel #1b1f25, ink #e8ecf0, mute #9aa4b0, seam #2b313a, peg #3d444e, and brighter bands (red #ff5d5f, amber #f4a259, emerald #45c79c, blue #74a6e6, violet #a98ad9, rose #f0709e, slate #9aa4b0).

### Named Rules
**The Quarantine Rule.** Colour appears only on the board, in symbols mapped to a band on the board, and in the chrome's two signals (red = you are here or this is wrong; blue = due). Every other chrome element is ink, mute, seam, or ground.

**The Same Band Rule.** A quantity keeps one band colour across all four stages: its slider label, its board stroke, its board tag, and its symbol in the formula. Stage 4 colours symbols exactly like the bands the learner pulled.

**The Never-Only-Colour Rule.** A band colour is always paired with a position or a label on the board (knockout tags, dashed vs solid, peg size), so colour is never the sole cue.

## Typography

**Display Font:** Figtree (with ui-sans-serif, system-ui)
**Body Font:** Figtree
**Label/Mono Font:** Figtree with tabular figures (`--font-mono` exists but is not used in this world)

**Character:** One friendly geometric sans in weights 400 to 800. Heavy 800 titles with tight tracking give the board a confident caption; everything else stays at 400 to 600 so the bands carry the emphasis.

### Hierarchy
- **Display** (800, 28px, 1.08, tracking -0.025em, balanced): track title, completion title, track-selection title, and the Stage 4 formula.
- **Headline** (700, 22px, 1.375, tracking -0.025em, min-height 3.5rem, balanced): the scene prompt above the board in Lesson and Review; turns band-red on a miss. Announced with `aria-live`.
- **Wordmark** (800, 19px): "Versado" beside the logo, and page titles in the 56px header.
- **Title** (800, 18px): the current module in the path panel, track rows.
- **Body** (400, 16px): explanations, error and empty-state copy.
- **Meta** (400, 14px): track meta line (domain · progress · due), links such as "Change track".
- **Label** (600, 13px, tabular): session meter, slider labels (14px, band-coloured), header sub-info.
- **Caption** (600, 12px): stage name beside the rail, module status under a peg.
- **Board Tag** (700, 13px scaled by crop factor k, tabular): values written on shapes, with a 4px ground-coloured knockout stroke.
- **Board Tick** (400, 11px, tabular, mute): axis numbers, knocked out 3px.
- **Nav** (11px; 700 active, 600 inactive).

### Named Rules
**The Tabular Rule.** Every number (values, ticks, minutes, counts) sets in tabular figures; `.gb-surface` turns them on for the whole world.

**The Label-On-The-Shape Rule.** Values sit on or beside the shape they describe, knocked out from what is drawn behind them; no detached legends on screen.

## Layout

Single column, mobile first. Learn home uses a 576px max container with 20px gutters; Lesson, Review and Track selection use 448px with 16px (Lesson) or 20px gutters. Headers are 56px tall with a seam beneath (the Lesson player swaps this for a 48px close + rail bar). Content scrolls above a fixed 64px bottom nav, so pages reserve about 112px of bottom padding.

The lattice unit is 28px, offset 14px; it is both the CSS dot background (`.gb-lattice`) and the SVG peg grid. On a chapter's path the pegs sit in one column on that lattice, each level with its lesson card's title, and the cards set the rhythm (12px between rows); duration is written on the card ("4 min") rather than drawn as segment length.

The Lesson player is full-screen (`min-h-dvh`, safe-area padding top and bottom): rail, prompt, board panel, controls, then the action footer. At the prediction gate the prompt reserves the height of its longest possible text (challenge, every diagnosis, success), so a verdict never pushes the board down while the learner reads the evidence; the footer keeps one primary button across stages (focus survives a stage change), with any finish error set above it. The footer is pinned to the bottom of the screen with `margin-top: auto`, so the primary action stays in the same thumb position on every stage. Vertical rhythm is 12px between prompt and board, 16px from board to controls, 24px above the footer.

### Named Rules
**The Same-Place Action Rule.** One primary action per scene, full width, pinned at the bottom of the lesson screen in the thumb zone.

## Elevation & Depth

Flat. Depth is tonal and linear: panel tone over ground tone, and 1px seams. The current-module panel is distinguished by a 1px ink border rather than lift. The only `box-shadow` in the world is the slider thumb's focus halo (3px band-blue at 45%), which is a focus ring, not elevation.

### Named Rules
**The Seam Rule.** Separate with a 1px seam or a tone step, never a drop shadow.

## Shapes

Square-ish and engineered: 5px on controls (buttons, steppers, close button), 6px on panels (board panel, path frame, current-module panel). Everything that is a peg or a rail is fully round: lattice dots (1.6 to 1.8px radius), path pegs (7px, current 9px with a 14px red halo at 18%), the nav peg (6px dot), rail segments and meters (4px tall, round caps).

Bands are drawn as round-capped strokes: 5px for primary bands (path progress, dimension bands), 2px for future path and outlines, 1.5px for rectangle outlines and axes. Tiles inset 2px from their cell with a 3px radius.

Dash grammar is semantic: dashed blue ring (4 3) = due review; dashed red, marching (6 4 or 5 4) = what the answer left out or the true position; dashed mute (3 3) = run guides and dashed band-amber (3 3) = rise guides in the guided demonstration; in the vertex demonstration a dashed mute (3 3) chord joins equal-height points with a small mute dot at its midpoint (the axis of symmetry), and a dashed violet (3 3) line carries the vertex height to the vertical axis; a dashed mute glyph marks the non-track Flashcards option.

## Components

### Buttons
Solid and tactile, never coloured.
- **Shape:** gently squared (5px), 48px tall.
- **Primary:** graphite ink fill, ground-coloured text, 16px bold, full width, 20px side padding. Press scales to 0.985 over 150ms. Disabled drops to 35% opacity.
- **Secondary:** transparent with a 1px seam border, ink text, 600 weight; hover darkens the border to mute. Used icon-only (48px square) for Replay.
- **Focus:** 2px band-blue outline, 2px offset, across the world.

### Band Slider (signature control)
A band on a track with a peg for a thumb, built on a native range input. The 4px track fills with the variable's band colour up to the value and seam after it; the thumb is a panel-coloured circle (24px WebKit, 18px Firefox) with a 3px band-coloured ring that scales to 1.15 while dragged. The label (14px, 600) is set in the same band colour. Flanking 44px stepper buttons (5px radius, seam border, Lucide minus/plus) step by the control's increment, with the value between them in 16px bold tabular figures.

**Locked state** (assisted completion presets): the track fills fully with the band at 45%, the thumb shrinks to a small solid band-coloured dot with no panel ring, the cursor is default and the steppers dim. The value still reads at full strength, as a resolved figure. No lock glyph.

### Cards / Containers
- **Board Panel:** 6px radius, 1px seam border, ground fill, 8px padding, clips its SVG board.
- **Current-Module Panel:** 6px radius, 1px ink border, panel fill, 16px padding, title + stage/minutes caption + full-width primary button.
- **Lists:** Track selection uses seam-divided rows between seam top and bottom rules, no cards.
- **Learn hub (`/`):** tracks grouped by domain under a **Peg Divider** (`PegDivider`: a 1px seam hooked between two 6px peg-grey dots, the 12px 600 mute domain name on the left; no uppercase kicker). Each track is a seam-divided row (track glyph, title as an h3, subtitle, progress caption, 4px ink-on-seam rail, chevron). The track in progress opens in place into the current-module panel (1px ink border): next module + minutes, the same progress caption ("11 of 17 modules" plus a Due Pill when checks are due) over the rail, full-width Continue, and a "See the whole path" link with a 44px target. The progress caption is shared by both states, so the rail is never the only cue. A domain with no tracks shows a dashed mute glyph and "Tracks on the way".
- **Track page (`/tracks/:id`):** the same grammar one level down: one Peg Divider per chapter ("Chapter 1", "Chapter 2"; the order is information), a chapter card (see Peg Path below), and the chapter holding the next module opened into the current-module panel. The peg path itself lives on the chapter page (`/tracks/:id/chapters/:chapterId`), one chapter per board, with a "Next chapter" row once the chapter is done.

- **Back links and text links** ("All tracks", "See the whole path", "See the chapter's path") keep a 44px target; the due link in a meta line never breaks across lines.

### Navigation
Fixed bottom bar, panel fill, seam top border, 64px tall plus safe area, max 448px of items: Learn, Review, Flashcards, Profile. Lucide outline icons at 22px (stroke 1.9 inactive, 2.4 active), 11px labels. Active is ink and bold, inactive mute; the active item is marked by a 6px red peg above its icon. The Review item carries a blue due-count badge (pill, 2px panel-coloured border, 10px bold tabular).

### Stage Rail
Four equal 4px round segments with 4px gaps (five when the module has a practice phase): done segments ink, the current segment red, upcoming seam, followed by the stage name as a 12px mute caption. In practice the caption carries the count ("Practice 2/3"); nothing sits above the scene prompt. Screen readers get each stage's name and the current marker.

### Practice Phase (faded worked examples)
After formalization, an optional run of exercises fades help in a fixed order: **guided** (the system morphs the band into place while drawing run, then rise, between the target points; value tags stay hidden until it settles; replay + Continue), **assisted** (some controls preset to their solved value and locked), **autonomous** (all controls live). Help never returns once faded. The help level is shown by the board and the controls, not by a label.

### Peg Path (signature)
The track drawn as one band hooked peg to peg down the lattice. Done segments are 5px ink; the segment into the current module is 5px red; future segments are 2px red at 40%. Done pegs are filled ink, the current peg is large red with a soft halo, locked pegs are hollow with a peg-grey stroke, and due modules wear the dashed blue ring. Text never sits on the lattice: each lesson is a card beside its peg.

- **Lesson card (disclosure):** panel fill, 1px seam border that darkens to mute on hover and while open, 6px radius, no shadow. The current lesson's card has the 1px ink border, carries `aria-current="step"`, and opens by default; only one card is open at a time. Closed: the title owns the full width (16px bold; current 18px 800; locked in mute; 24px line box) with its status on the line below (blue **Due Pill**, or "Done" as a 12px mute caption), and a chevron on the first title line that turns 180° on open. The peg sits level with the first title line, and the peg column sits on the 28px lattice.
- **Open:** one 12px tabular mute line of facts (stage and minutes, last and next check, as relative days), then one action: graphite primary "Review now" when a check is due (to `/review`), primary Start/Continue for the current or an open lesson, secondary "Practice again" when done, and for a locked lesson the lesson that opens it instead of a button. The card never shows the lesson's `targetSkill`: it is the conclusion, and showing it would spoil the prediction gate and the spaced check.
- **Motion:** the body eases open by animating grid rows from 0fr to 1fr over 200ms ease-out; under reduced motion it snaps. Closed content is `inert`.
- **Due Pill:** band-blue text on band-blue at 14% (`color-mix`), full round, 12px 600 tabular. Used wherever "due" is a status (lesson cards, chapter cards), matching the dashed ring and the blue due links. Blue stays a status colour: action buttons remain graphite.
- **Chapter cards (track page):** the chapter rows are cards too: panel fill, seam border darkening to mute on hover, title, subtitle, progress caption with a Due Pill, a 4px rail, and a chevron. Locked chapters have no fill, link or rail.

### Boards (interactives)
SVG boards built from shared parts: a viewBox crop that fits the figure (with a scale factor k so tags keep their on-screen size), a peg lattice or a coordinate plane (pegs on integers, seam axes, knocked-out tick labels drawn last), and knockout tags. Moving parts carry the snap transition; a changed band pulses its stroke 3px wider for 320ms. Lines (whose endpoints CSS cannot animate) settle through the same curve in JS (`useSettle`); value tags always print the exact value, only geometry springs.

- **Stage 1 is silent:** during anchoring the board hides every text element (`.gb-anchoring`): no numbers, ticks or notation, only motion and shape.
- **Direction arrowhead:** every plotted line ends in a small arrowhead at its right end, so rising and falling read at a glance; the step bar flips below the line when the slope is negative.
- **Sign-error arrow:** when a prediction points the wrong way, a dashed, marching red band with an arrowhead leaves the start point in the needed direction. It shows direction only, never the full answer line, so the prediction gate stays honest.
- **Parabola board:** the curve is sampled and clipped to the plane. With `a` alone the vertex is an ink pin and `a` is read as a step bar one unit out (like the slope). The vertex form adds the axis of symmetry as a dashed band-emerald (4 4) vertical carrying `h`, and the vertex as a violet dot carrying `k`. The general form (a wider ±4 × ±6 window, so the vertex stays visible across the b range) shows the crossing (0, c) as a ground-ringed violet dot drawn above target marks, and `b` as a short amber touching line there, labelled on the line left of the crossing: the curve's lean, the same idea as the slope `m`.
- **Roots view:** the vertex form with only `k` exposed (a and h fixed) uses its own window (−1..5 × −5..3) so the vertex can sink to k = −4. Roots are ink rings on the floor carrying their x value (a single thicker ring when the curve just touches); they pulse as they appear or vanish, and tick labels beside them step aside. A curve that never reaches the floor is a named miss (`noRoots`).
- **Complete-square board:** x is an unknown, so x² and the strips are opaque (the lattice can't be counted through them) and x is never given a number; only the empty corner shows pegs. The prediction shows x² beside the **whole** strip (labelled b); halving is the learner's step, and the reveal splits and wraps it. A wrong tile is drawn at the corner at the size the answer implies (b² as a b-by-b square, others as a b/2-wide strip), dashed red and marching, over the dashed emerald true corner. Area labels (x², 3x, 9) appear only in Stage 4. From Stage 3 the board crops to the question's figure (fixed per question, so the reveal never zooms).
- **Line-pair board:** a fixed blue line and a moving amber one on a wide −5..5 × −8..12 plane (start height on the up-axis rail, the line itself and its rose start peg; steepness a band slider). The board writes the count where it happens: a green peg with "1" at the crossing (an arrow tag at the edge when it lies off the board), the constant gap as rose dashes labelled at three spots clear of the up axis when there is none, and the whole shared line glowing with ∞ when the lines coincide (the amber line dashed over the blue). Stage 1 leaves a faint dashed ghost of the parallel position once the tilt starts, so the reduced-motion frame tells both halves. The prediction shows only each line's start and heading (stubs with their steepness) and a 0 / 1 / endless choice; a miss turns the evidence red and marching (gaps, a ring on the crossing, or the shared line). Named misses: `alwaysOne`, `endless`, `sameLine`, `crosses`.
- **Labelled choices:** `ChoiceGrid` takes `choiceLabels` (i18n keys by value) for answers that are words; three options sit in three columns, and word labels set at 16px so they fit in every language.
- **Named misses:** besides `sign`, the vertex board diagnoses `height` (equal gaps: axis right, move k), `axis` (unequal gaps: move h) and `noRoots` (vertex on the wrong side of the floor); content supplies copy per kind (`adaptiveFeedback.byKind`). The sign arrow for `a` stands vertically one unit out from the vertex, where the step bar must go.
- **Gaps stay on the board:** a miss gap that would leave the plane stops at the edge with a short red cut mark; its delta tag stays inside and steps off the axis tick row. Tick labels next to marked points (targets, start dots) step aside.

**Motion grammar.** Snap: 240ms `cubic-bezier(0.34, 1.56, 0.64, 1)` on position and size; opacity on marks at most 200ms ease-out. Pulse: 320ms `cubic-bezier(0.16, 1, 0.3, 1)`. March: dashes travel 16 units per 900ms, linear, only on diagnostic outlines. Stage 1 anchoring is a scripted 0-to-1 drive. Under `prefers-reduced-motion`, snap, pulse, march and thumb transitions are removed and anchoring jumps to its final frame.

## Do's and Don'ts

### Do:
- **Do** set every skill-track surface inside `.gb-surface` so ground, ink, tabular figures, blue focus rings and blue selection come with it.
- **Do** draw anything that behaves like space on the 28px lattice, and make lengths mean something (minutes, units, values).
- **Do** give each variable one band colour from the spec and reuse it on its slider label, its board stroke, its tag and its formula symbol.
- **Do** show a wrong prediction as a shape: the missing or correct band dashed and marching in red, with the signed delta written on it, and the prompt turned red.
- **Do** keep the primary action full width at the bottom of the screen, ink on ground, one per scene.
- **Do** ship a static, equally informative frame for every motion under reduced motion.

### Don't:
- **Don't** use band colours for chrome decoration, headings, backgrounds, or brand accents; outside the board only red (current, error) and blue (due, focus) carry colour.
- **Don't** add drop shadows or elevated cards; use a seam or a tone step.
- **Don't** introduce a new hue for a state; tint the existing band with `color-mix` instead.
- **Don't** add streak flames, mascots, or a brand-blue progress path.
- **Don't** place a legend away from the board; label the shape itself.
- **Don't** borrow the legacy flashcard tokens (`primary-*`, `neutral-*`, `--shadow-card*`) into skill-track surfaces.
