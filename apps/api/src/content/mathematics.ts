import type { LearningChapterInput, LearningModuleInput, LearningTrackInput } from "@versado/validation";

/**
 * Course (track): Mathematics. Chapter: Algebra through Geometry.
 * Visual and experimental first — every algebraic idea is anchored in a shape or a
 * coordinate plane the learner manipulates before seeing any notation.
 * Each module follows the YAML template in intuitive_interactive_learning.md §3.
 * Linear functions are taught in isolated blocks first (m alone, then c alone),
 * then combined, then practised with fading help (guided → assisted → autonomous).
 * Quadratics follow the same path: a alone, then the vertex (h, k), then the general form,
 * where b is read as the curve's lean at the crossing (the slope from the linear modules).
 */
export const mathTrack: LearningTrackInput = {
  id: "mathematics",
  domain: "mathematics",
  title: "Mathematics",
  subtitle: "Learn mathematics by seeing, moving and predicting.",
  description:
    "Build intuition for algebra with shapes and the coordinate plane: areas become products, squares reveal identities, and equations become lines that meet.",
  icon: "Shapes",
  colorToken: "blue",
  position: 0,
  status: "published",
};

export const algebraChapter: LearningChapterInput = {
  id: "math-algebra",
  trackId: "mathematics",
  position: 0,
  title: "Algebra",
  subtitle: "Algebra through geometry: see it, move it, predict it — then write it.",
  description: "Build algebraic intuition through shapes and the coordinate plane.",
  status: "published",
};

export const algebraModules: LearningModuleInput[] = [
  {
    id: "math-area-product-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 0,
    title: "Multiplying is area",
    interactive: "area-product",
    estimatedMinutes: 3,
    status: "published",
    spec: {
      targetSkill: "A product a·b is the number of unit tiles in an a-by-b rectangle.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A rectangle grows from a single tile; columns and rows fill in until the shape is tiled.",
        caption: "A rectangle grows, tile by tile.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Width", colorToken: "blue" },
          { label: "Height", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Stretch the sides. Watch the tiles fill in.",
        controls: [
          {
            controlType: "slider",
            variableName: "a",
            label: "Width",
            min: 1,
            max: 10,
            step: 1,
            initial: 3,
            colorToken: "blue",
            visualSignaling: "New columns flash blue as they appear",
          },
          {
            controlType: "slider",
            variableName: "b",
            label: "Height",
            min: 1,
            max: 8,
            step: 1,
            initial: 2,
            colorToken: "amber",
            visualSignaling: "New rows flash amber as they appear",
          },
        ],
        spatialContiguityRules: [
          "Width value sits on the bottom edge",
          "Height value sits on the left edge",
          "Tile count sits inside the rectangle",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Width is 6. Set the height for 24 tiles.",
        userAction: "Adjust the height with the width locked at 6, then reveal",
        target: { a: 6, area: 24 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The highlighted rows show the tiles you are missing or have extra.",
          onSuccess: "Exactly 24 tiles: 6 columns, 4 rows.",
        },
      },
      stage4Formalization: {
        formalExpression: "a · b = area",
        caption: "Multiplying counts the tiles of a rectangle.",
        colorMapping: [
          { symbol: "a", matchesVisual: "Width (columns)", colorToken: "blue" },
          { symbol: "b", matchesVisual: "Height (rows)", colorToken: "amber" },
          { symbol: "area", matchesVisual: "Tiles inside", colorToken: "emerald" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Width locked at 3; find the height for 21 tiles.",
        spacedReviewPrompt: "Width is 3. Set the height for 21 tiles.",
        reviewOnSuccess: "Exactly 21 tiles: 3 columns, 7 rows.",
        reviewTarget: { a: 3, area: 21 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-binomial-square-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 1,
    title: "The square of a sum",
    interactive: "binomial-square",
    estimatedMinutes: 4,
    status: "published",
    spec: {
      targetSkill: "(a + b)² splits into a², two a·b strips and b² — never just a² + b².",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A large square is sliced by one vertical and one horizontal cut into four pieces that pull apart and snap back.",
        caption: "One square, two cuts, four pieces.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Long side a", colorToken: "blue" },
          { label: "Short side b", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Slide a and b. Watch each piece resize.",
        controls: [
          {
            controlType: "slider",
            variableName: "a",
            label: "a",
            min: 1,
            max: 8,
            step: 1,
            initial: 6,
            colorToken: "blue",
            visualSignaling: "The a-square and both strips pulse as a changes",
          },
          {
            controlType: "slider",
            variableName: "b",
            label: "b",
            min: 1,
            max: 5,
            step: 1,
            initial: 3,
            colorToken: "emerald",
            visualSignaling: "The b-square and both strips pulse as b changes",
          },
        ],
        spatialContiguityRules: [
          "Each piece shows its own area inside it",
          "Side lengths sit on the edges they measure",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "a is 3, b is 2. Predict the total area.",
        userAction:
          "Pick the total area from four boxes (the truth and three named misconceptions), then reveal",
        target: { a: 3, b: 2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dashed strips are the pieces your answer left out.",
          onSuccess: "Two squares plus two strips — every piece counted.",
          byKind: {
            doubled: "Doubling adds the sides. Squaring fills the square — count every piece inside.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "(a + b)² = a² + 2ab + b²",
        caption: "Each symbol is one piece you just measured.",
        colorMapping: [
          { symbol: "a²", matchesVisual: "Large square", colorToken: "blue" },
          { symbol: "2ab", matchesVisual: "Two side strips", colorToken: "amber" },
          { symbol: "b²", matchesVisual: "Small corner square", colorToken: "emerald" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Same identity with a = 5 and b = 1.",
        spacedReviewPrompt: "a is 5, b is 1. Predict the total area.",
        reviewOnSuccess: "Total 36: 25 + 5 + 5 + 1 — every piece counted.",
        reviewTarget: { a: 5, b: 1 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-factoring-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 2,
    title: "Factoring is un-multiplying",
    // New board: algebra tiles (big square, strips, small tiles), built on the area-product board.
    interactive: "algebra-tiles",
    estimatedMinutes: 4,
    status: "draft",
    spec: {
      targetSkill:
        "Factoring finds the two sides of the rectangle a set of tiles already makes: strips add the extras, small tiles multiply them.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "One big square, a few long strips and some small tiles lie scattered on the pegs, then slide together into a single rectangle whose two edges light up.",
        caption: "Loose pieces, one rectangle.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Big square", colorToken: "blue" },
          { label: "Long strip", colorToken: "amber" },
          { label: "Small tile", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Stretch each side. Count the strips and small tiles.",
        controls: [
          {
            controlType: "slider",
            variableName: "p",
            label: "Right side extra",
            min: 1,
            max: 5,
            step: 1,
            initial: 2,
            colorToken: "rose",
            visualSignaling: "A column of strips and small tiles grows on the right edge",
          },
          {
            controlType: "slider",
            variableName: "q",
            label: "Bottom side extra",
            min: 1,
            max: 5,
            step: 1,
            initial: 3,
            colorToken: "violet",
            visualSignaling: "A row of strips and small tiles grows on the bottom edge",
          },
        ],
        spatialContiguityRules: [
          "Each side's extra is written on the edge it lengthens",
          "The strip count and the small-tile count sit inside their own groups",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Build one rectangle from these tiles.",
        userAction:
          "Given 1 big square, 5 strips and 6 small tiles, set both side extras so every tile fits, then reveal",
        // The board lays out the tiles of (x + p)(x + q); p and q in either order are correct.
        target: { p: 2, q: 3 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Dashed tiles show what your rectangle is missing; red ones are extra.",
          onSuccess: "Five strips, six small tiles: extras 2 and 3 fit exactly.",
          byKind: {
            swapped: "Your sides make 6 strips and 5 tiles: strips add the extras, tiles multiply them.",
            stripsOnly: "The strips fit, but the corner needs a different number of small tiles.",
            tilesOnly: "The small tiles fit, but the strips no longer cover both sides.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "x² + 5x + 6 = (x + 2)(x + 3)",
        caption: "Factoring reads off the sides of the rectangle the tiles make.",
        colorMapping: [
          { symbol: "x²", matchesVisual: "Big square", colorToken: "blue" },
          { symbol: "5x", matchesVisual: "Five long strips", colorToken: "amber" },
          { symbol: "6", matchesVisual: "Six small tiles", colorToken: "emerald" },
          { symbol: "+ 2", matchesVisual: "Right side extra", colorToken: "rose" },
          { symbol: "+ 3", matchesVisual: "Bottom side extra", colorToken: "violet" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Mix with the square of a sum: some tile sets make a square, most make a rectangle.",
        spacedReviewPrompt: "Build one rectangle: 7 strips, 12 small tiles.",
        reviewOnSuccess: "Extras 3 and 4: they add to 7 strips and multiply to 12 tiles.",
        reviewTarget: { p: 3, q: 4 },
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the tiles find their sides.", fade: "guided", target: { p: 1, q: 3 }, presetControls: [] },
          { prompt: "One side is set. Find the other.", fade: "assisted", target: { p: 2, q: 4 }, presetControls: ["p"] },
          {
            prompt: "Build the rectangle from 7 strips and 10 tiles.",
            fade: "autonomous",
            target: { p: 2, q: 5 },
            presetControls: [],
          },
        ],
      },
    },
  },
  {
    id: "math-linear-slope-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 3,
    title: "Steepness and direction",
    interactive: "slope-intercept",
    estimatedMinutes: 3,
    status: "published",
    spec: {
      targetSkill: "m sets how steep a line is, and its sign sets whether it rises or falls.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A line pinned at the origin swings like a lever: steep uphill, flatter, flat, then downhill.",
        caption: "One pin, one lever: uphill, flat, downhill.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Climb per step", colorToken: "amber" },
          { label: "The line", colorToken: "blue" },
        ],
      },
      stage2Exploration: {
        prompt: "Drag m past zero. Watch the line turn downhill.",
        controls: [
          {
            controlType: "slider",
            variableName: "m",
            label: "m",
            min: -3,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The step bar flips below the line when m turns negative",
          },
        ],
        fixed: { c: 0 },
        spatialContiguityRules: [
          "The value of m sits on the step bar",
          "The direction arrow sits at the line's right end",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Tilt the line through the ringed point.",
        userAction: "Set m so the line passes the target point, then reveal",
        target: { x1: 0, y1: 0, x2: 2, y2: -3 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dashed gap shows how far the point is from your line.",
          onSuccess: "Down 3 over 2 steps: m is −1.5.",
          onSignError: "Your line climbs, but the point lies downhill. Flip the sign of m.",
        },
      },
      stage4Formalization: {
        formalExpression: "y = m·x",
        caption: "The size of m is steepness; its sign is direction.",
        colorMapping: [
          { symbol: "m", matchesVisual: "Climb per step (sign = direction)", colorToken: "amber" },
          { symbol: "x", matchesVisual: "Steps to the right", colorToken: "slate" },
          { symbol: "y", matchesVisual: "Height of the line", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Now the point is uphill: the sign must flip back.",
        spacedReviewPrompt: "Tilt the line through the ringed point.",
        reviewOnSuccess: "Up 3 over 2 steps: m is 1.5.",
        reviewTarget: { x1: 0, y1: 0, x2: 2, y2: 3 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-linear-intercept-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 4,
    title: "Where the line starts",
    interactive: "slope-intercept",
    estimatedMinutes: 3,
    status: "published",
    spec: {
      targetSkill: "c slides the whole line up or down without changing its tilt.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A tilted line glides up and down like a shelf on a rail; its angle never changes.",
        caption: "Same tilt, sliding up and down.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Start height", colorToken: "violet" },
          { label: "The line", colorToken: "blue" },
        ],
      },
      stage2Exploration: {
        prompt: "Slide c. The tilt stays; only the start moves.",
        controls: [
          {
            controlType: "slider",
            variableName: "c",
            label: "c",
            min: -2,
            max: 5,
            step: 1,
            initial: 0,
            colorToken: "violet",
            visualSignaling: "The start point on the vertical axis moves with the line",
          },
        ],
        fixed: { m: 1 },
        spatialContiguityRules: ["The value of c sits beside the start point on the vertical axis"],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Slide the line onto both ringed points.",
        userAction: "Set c with the tilt fixed, then reveal",
        target: { x1: 2, y1: 5, x2: 3, y2: 6 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dashed gaps show how far to slide the line.",
          onSuccess: "Same tilt, lifted to start at 3.",
        },
      },
      stage4Formalization: {
        formalExpression: "y = x + c",
        caption: "c is the height where the line crosses the vertical axis.",
        colorMapping: [
          { symbol: "c", matchesVisual: "Start height (x = 0)", colorToken: "violet" },
          { symbol: "x", matchesVisual: "Steps to the right", colorToken: "slate" },
          { symbol: "y", matchesVisual: "Height of the line", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Now the line has to start below zero.",
        spacedReviewPrompt: "Slide the line onto both ringed points.",
        reviewOnSuccess: "Same tilt, lowered to start at −2.",
        reviewTarget: { x1: 1, y1: -1, x2: 2, y2: 0 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-slope-intercept-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 5,
    title: "Putting m and c together",
    interactive: "slope-intercept",
    estimatedMinutes: 5,
    status: "published",
    spec: {
      targetSkill: "Any straight line is y = m·x + c: m tilts it, c lifts it.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A point walks right across a grid, climbing the same amount at every step and leaving a straight trail.",
        caption: "Same climb at every step makes a straight path.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Climb per step", colorToken: "amber" },
          { label: "Start height", colorToken: "violet" },
        ],
      },
      stage2Exploration: {
        prompt: "Tilt with m, lift with c. Try a falling line.",
        controls: [
          {
            controlType: "slider",
            variableName: "m",
            label: "m",
            min: -3,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The step bar redraws with each tilt and flips when m is negative",
          },
          {
            controlType: "slider",
            variableName: "c",
            label: "c",
            min: -2,
            max: 5,
            step: 1,
            initial: 0,
            colorToken: "violet",
            visualSignaling: "The start point on the vertical axis moves with the line",
          },
        ],
        spatialContiguityRules: [
          "The value of m sits on the step bar",
          "The value of c sits on the vertical axis crossing",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Set the line through both ringed points.",
        userAction: "Adjust m and c, then reveal",
        target: { x1: 0, y1: 1, x2: 2, y2: 5 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Dashed gaps show how far each point sits from your line.",
          onSuccess: "Up 4 over 2 steps: m is 2, starting at 1.",
          onSignError: "Your line and the points slope opposite ways. Flip the sign of m.",
        },
      },
      stage4Formalization: {
        formalExpression: "y = m·x + c",
        caption: "m is the climb per step; c is where the line starts.",
        colorMapping: [
          { symbol: "m", matchesVisual: "Climb per step", colorToken: "amber" },
          { symbol: "c", matchesVisual: "Start height", colorToken: "violet" },
          { symbol: "x", matchesVisual: "Steps to the right", colorToken: "slate" },
          { symbol: "y", matchesVisual: "Height of the line", colorToken: "blue" },
        ],
      },
      practice: {
        items: [
          {
            prompt: "Watch: rise over run gives m; the start gives c.",
            fade: "guided",
            target: { x1: 0, y1: -1, x2: 2, y2: 3 },
            presetControls: [],
          },
          {
            prompt: "c is set for you. Find the m that fits.",
            fade: "assisted",
            target: { x1: 0, y1: 4, x2: 2, y2: 0 },
            presetControls: ["c"],
          },
          {
            prompt: "On your own: set m and c for both points.",
            fade: "autonomous",
            target: { x1: 1, y1: 1, x2: 2, y2: -1 },
            presetControls: [],
          },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Points that fall left to right need a negative m.",
        spacedReviewPrompt: "Set the line through both ringed points.",
        reviewOnSuccess: "Down 4 over 2 steps: m is −2, starting at 4.",
        reviewTarget: { x1: 0, y1: 4, x2: 2, y2: 0 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-linear-inequality-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 6,
    title: "Inequalities are regions",
    // New board: a fixed line on the plane, a draggable test point and a shaded side.
    interactive: "line-region",
    estimatedMinutes: 4,
    status: "draft",
    spec: {
      targetSkill:
        "An inequality is a whole side of a line: every point there is higher (or lower) than the line at its own x.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A line is laid across a field of pegs; as it tilts, the pegs above it glow and the pegs below stay plain.",
        caption: "A line splits the plane into two sides.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "The line", colorToken: "blue" },
          { label: "Pegs above", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Drag the point. Watch when it rises above the line.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "px",
            label: "Point x",
            min: -4,
            max: 4,
            step: 1,
            initial: -2,
            colorToken: "slate",
            visualSignaling: "A vertical gap from the point to the line follows the point",
          },
          {
            controlType: "drag_handle",
            variableName: "py",
            label: "Point height",
            min: -4,
            max: 6,
            step: 1,
            initial: 3,
            colorToken: "violet",
            visualSignaling: "The gap turns emerald above the line and stays mute below it",
          },
        ],
        // Building block: a gentle rising line first; the prediction uses a falling one.
        fixed: { m: 1, c: 1 },
        spatialContiguityRules: [
          "The point's height and the line's height at the same x sit at the two ends of the gap",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Shade the side where points sit lower than the line.",
        userAction: "Pick the side (above or below the falling line) to shade, then reveal test points",
        // side: 1 = above, -1 = below. The line falls (m < 0), so "lower" is not "to the left".
        target: { m: -2, c: 3, side: -1 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Each dashed gap shows a point on your side that rises above the line.",
          onSuccess: "Every point below the line is lower than it at its own x.",
          byKind: {
            leftRight: "Lower means below the line at the same x, not to its left.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "y < −2x + 3",
        caption: "An inequality is a whole region, bounded by its line.",
        colorMapping: [
          { symbol: "y", matchesVisual: "The point's height", colorToken: "violet" },
          { symbol: "−2x + 3", matchesVisual: "The line's height at the same x", colorToken: "blue" },
          { symbol: "<", matchesVisual: "The shaded side below the line", colorToken: "emerald" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "A rising line with the upper side asked for, mixed with where-the-line-starts checks.",
        spacedReviewPrompt: "Shade the side where points sit higher than the line.",
        reviewOnSuccess: "Above the line: every point there is higher than it.",
        reviewTarget: { m: 1, c: -1, side: 1 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-shape-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 7,
    title: "Opening and direction",
    interactive: "parabola",
    estimatedMinutes: 3,
    status: "published",
    spec: {
      targetSkill: "In y = a·x², the size of a sets how narrow the curve is and its sign whether it opens up or down.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A curve pinned at its lowest point bends narrow, relaxes into a straight line, then bends the other way.",
        caption: "A curve bends open, flattens, then turns upside down.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Bend", colorToken: "amber" },
          { label: "The curve", colorToken: "blue" },
        ],
      },
      stage2Exploration: {
        prompt: "Drag a past zero. Watch the curve flip over.",
        controls: [
          {
            controlType: "slider",
            variableName: "a",
            label: "a",
            min: -3,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The step bar one unit from the vertex grows, shrinks and flips with a",
          },
        ],
        fixed: { h: 0, k: 0 },
        spatialContiguityRules: ["The value of a sits on the step bar one unit from the vertex"],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Bend the curve through the ringed point.",
        userAction: "Set a so the curve passes the target point, then reveal",
        target: { x1: 2, y1: -2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dashed gap shows how far the point is from your curve.",
          onSuccess: "One step out it drops half a step: a is −0.5.",
          onSignError: "Your curve opens up, but the point lies below. Flip the sign of a.",
        },
      },
      stage4Formalization: {
        formalExpression: "y = a·x²",
        caption: "The size of a is how narrow; its sign is up or down.",
        colorMapping: [
          { symbol: "a", matchesVisual: "Bend (sign = opening)", colorToken: "amber" },
          { symbol: "x", matchesVisual: "Steps from the vertex", colorToken: "slate" },
          { symbol: "y", matchesVisual: "Height of the curve", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Now the point is high and close: a steep, upward bend.",
        spacedReviewPrompt: "Bend the curve through the ringed point.",
        reviewOnSuccess: "One step out it climbs two steps: a is 2.",
        reviewTarget: { x1: 1, y1: 2 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-vertex-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 8,
    title: "Moving the vertex",
    interactive: "parabola",
    estimatedMinutes: 5,
    status: "published",
    spec: {
      targetSkill: "In y = a(x − h)² + k the vertex (h, k) carries the whole curve without changing its shape.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "The same curve glides around the board in a loop, its lowest point leading the way.",
        caption: "The same curve glides around the board.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Sideways", colorToken: "emerald" },
          { label: "Height", colorToken: "violet" },
        ],
      },
      stage2Exploration: {
        prompt: "Slide h and k. The vertex carries the whole curve.",
        controls: [
          {
            controlType: "slider",
            variableName: "h",
            label: "h",
            min: -1,
            max: 3,
            step: 0.5,
            initial: 0,
            colorToken: "emerald",
            visualSignaling: "The dashed axis of symmetry slides with h",
          },
          {
            controlType: "slider",
            variableName: "k",
            label: "k",
            min: -2,
            max: 5,
            step: 0.5,
            initial: 0,
            colorToken: "violet",
            visualSignaling: "The vertex dot rises and falls with k",
          },
        ],
        fixed: { a: 1 },
        spatialContiguityRules: [
          "The value of h sits on the axis of symmetry",
          "The value of k sits beside the vertex",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Move the curve onto both ringed points.",
        userAction: "Adjust h and k, then reveal",
        target: { x1: 1, y1: 0, x2: 3, y2: 0 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Dashed gaps show how far each point sits from your curve.",
          onSuccess: "Vertex at (2, −1): the curve just slid there.",
          byKind: {
            height: "Both points sit the same distance off: the axis is right. Move k.",
            axis: "The gaps differ: the axis of symmetry is off. Move h.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "y = (x − h)² + k",
        caption: "h moves the vertex sideways; k moves it up or down.",
        colorMapping: [
          { symbol: "h", matchesVisual: "Vertex left–right (axis of symmetry)", colorToken: "emerald" },
          { symbol: "k", matchesVisual: "Vertex height", colorToken: "violet" },
          { symbol: "x", matchesVisual: "Position along the floor", colorToken: "slate" },
          { symbol: "y", matchesVisual: "Height of the curve", colorToken: "blue" },
        ],
      },
      practice: {
        items: [
          {
            prompt: "Watch: equal heights meet halfway; the vertex sits there.",
            fade: "guided",
            target: { x1: 0, y1: 3, x2: 4, y2: 3, a: 1 },
            presetControls: [],
          },
          {
            prompt: "h is set for you. Find the height k.",
            fade: "assisted",
            target: { x1: -1, y1: 4, x2: 3, y2: 4, a: 1 },
            presetControls: ["h"],
          },
          {
            prompt: "On your own: this curve opens down. Place its vertex.",
            fade: "autonomous",
            target: { x1: 0, y1: 1, x2: 2, y2: 1, a: -1 },
            presetControls: [],
          },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Equal-height points again, but the vertex sits above the floor.",
        spacedReviewPrompt: "Move the curve onto both ringed points.",
        reviewOnSuccess: "Vertex at (1, 1): the curve just slid there.",
        reviewTarget: { x1: 0, y1: 2, x2: 2, y2: 2, a: 1 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-general-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 9,
    title: "The general form",
    interactive: "parabola",
    estimatedMinutes: 4,
    status: "published",
    spec: {
      targetSkill: "In y = ax² + bx + c, c is where the curve crosses the vertical axis and b is how it leans there.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A curve keeps one point on the vertical axis while the straight edge touching it there swings, dragging the curve along.",
        caption: "One crossing stays put while the curve leans.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Lean", colorToken: "amber" },
          { label: "Crossing", colorToken: "violet" },
        ],
      },
      stage2Exploration: {
        prompt: "c sets the crossing; b tilts the curve right there.",
        controls: [
          {
            controlType: "slider",
            variableName: "b",
            label: "b",
            min: -4,
            max: 4,
            step: 1,
            initial: 0,
            colorToken: "amber",
            visualSignaling: "The short touching line at the crossing tilts with b",
          },
          {
            controlType: "slider",
            variableName: "c",
            label: "c",
            min: -2,
            max: 5,
            step: 1,
            initial: 1,
            colorToken: "violet",
            visualSignaling: "The crossing dot on the vertical axis moves with c",
          },
        ],
        fixed: { a: 1 },
        spatialContiguityRules: [
          "The value of b sits on the touching line",
          "The value of c sits beside the crossing dot",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Fit the curve through both ringed points.",
        userAction: "Adjust b and c, then reveal",
        target: { x1: 0, y1: 3, x2: 1, y2: 0 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Dashed gaps show how far each point sits from your curve.",
          onSuccess: "c = 3 sets the crossing; b = −4 leans it downhill there.",
          onSignError: "Your curve leans the wrong way at the crossing. Flip the sign of b.",
        },
      },
      stage4Formalization: {
        formalExpression: "y = x² + b·x + c",
        caption: "c is where it crosses; b is how it leans there.",
        colorMapping: [
          { symbol: "b", matchesVisual: "Lean at the crossing", colorToken: "amber" },
          { symbol: "c", matchesVisual: "Crossing height", colorToken: "violet" },
          { symbol: "x", matchesVisual: "Position along the floor", colorToken: "slate" },
          { symbol: "y", matchesVisual: "Height of the curve", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Now the curve must lean uphill and cross below zero.",
        spacedReviewPrompt: "Fit the curve through both ringed points.",
        reviewOnSuccess: "c = −1 sets the crossing; b = 2 leans it uphill there.",
        reviewTarget: { x1: 0, y1: -1, x2: 1, y2: 2 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-complete-square-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 10,
    title: "Completing the square",
    // New board from the binomial-square pieces: x² plus bx split into two strips, corner missing.
    interactive: "complete-square",
    estimatedMinutes: 4,
    status: "draft",
    spec: {
      targetSkill:
        "To turn x² + bx into a square, split the strips in half and add the missing corner: a square of side b/2.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A square and a long strip sit side by side; the strip splits in two, the halves wrap around two edges of the square, and one small corner is left empty.",
        caption: "Split the strip, wrap it, find the gap.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Square", colorToken: "blue" },
          { label: "Strip halves", colorToken: "amber" },
          { label: "Missing corner", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Widen the strip. Watch the missing corner grow.",
        controls: [
          {
            controlType: "slider",
            variableName: "b",
            label: "Strip width b",
            min: 2,
            max: 10,
            step: 2,
            initial: 4,
            colorToken: "amber",
            visualSignaling: "Both strip halves and the empty corner resize together",
          },
        ],
        spatialContiguityRules: [
          "Each strip half shows its width b/2 on its own edge",
          "The empty corner shows its side on two of its edges",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Which tile completes the square?",
        userAction: "Pick the corner tile's area from four boxes (the truth, b, b² and b/2), then drop it in",
        // Correct corner: (b/2)² = 9. Wrong boxes come from the named misconceptions below.
        target: { b: 6 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dashed outline shows the corner your tile should fill.",
          onSuccess: "Half of 6 is 3; a 3 by 3 tile closes the square.",
          byKind: {
            whole: "That tile is the whole strip wide; the gap is half of it on each side.",
            linear: "That is the strip's width, not an area. The gap is a square: square its side.",
            half: "Half the strip is the corner's side. The corner needs that side squared.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "x² + 6x + 9 = (x + 3)²",
        caption: "Halve b and square it: that corner makes the shape a square.",
        colorMapping: [
          { symbol: "x²", matchesVisual: "Square", colorToken: "blue" },
          { symbol: "6x", matchesVisual: "Two strip halves of 3x", colorToken: "amber" },
          { symbol: "9", matchesVisual: "Missing corner, 3 by 3", colorToken: "emerald" },
          { symbol: "(x + 3)²", matchesVisual: "The completed square", colorToken: "slate" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Mix with the square of a sum and the vertex form: the completed square names the vertex.",
        spacedReviewPrompt: "b is 10. Which tile completes the square?",
        reviewOnSuccess: "Half of 10 is 5; a 5 by 5 tile, area 25, closes it.",
        reviewTarget: { b: 10 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-roots-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 11,
    title: "Where the curve meets the floor",
    interactive: "parabola",
    estimatedMinutes: 4,
    status: "published",
    spec: {
      targetSkill: "Roots exist only when the vertex sits on the far side of the floor from where the curve opens: x = h ± √(−k/a).",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "An upward curve sinks through the floor and rises again: two crossings appear, merge into one touch, then vanish.",
        caption: "Sink the curve: two crossings, one touch, none.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Vertex height", colorToken: "violet" },
          { label: "Crossings", colorToken: "slate" },
        ],
      },
      stage2Exploration: {
        prompt: "Lower k through the floor. Watch the crossings split apart.",
        controls: [
          {
            controlType: "slider",
            variableName: "k",
            label: "k",
            min: -4,
            max: 3,
            step: 0.25,
            initial: 2,
            colorToken: "violet",
            visualSignaling: "Crossing rings appear on the floor and slide apart as k drops",
          },
        ],
        fixed: { a: 1, h: 2 },
        spatialContiguityRules: [
          "Each crossing's position sits under its ring on the floor",
          "The value of k sits beside the vertex",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Set k so the curve crosses at both rings.",
        userAction: "Lower or raise the vertex until the crossings land on the rings, then reveal",
        target: { x1: 1, y1: 0, x2: 3, y2: 0 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Dashed gaps show how far the curve is from each ring.",
          onSuccess: "One step each side of the axis: k is −1.",
          byKind: {
            noRoots: "Your curve never reaches the floor. Move the vertex across it.",
            height: "Both crossings miss by the same amount. Move the vertex up or down.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "x = h ± √(−k / a)",
        caption: "The crossings sit equally either side of h, if −k/a ≥ 0.",
        colorMapping: [
          { symbol: "h", matchesVisual: "Axis of symmetry", colorToken: "emerald" },
          { symbol: "k", matchesVisual: "Vertex height", colorToken: "violet" },
          { symbol: "a", matchesVisual: "Opening (fixed at 1 here)", colorToken: "amber" },
          { symbol: "x", matchesVisual: "Crossings on the floor", colorToken: "slate" },
        ],
      },
      practice: {
        items: [
          {
            prompt: "Watch: the vertex drops until the curve hits both rings.",
            fade: "guided",
            target: { x1: 0, y1: 0, x2: 4, y2: 0, a: 1 },
            presetControls: [],
          },
          {
            prompt: "This curve opens down. Place the vertex to cross at both rings.",
            fade: "autonomous",
            target: { x1: 1, y1: 0, x2: 3, y2: 0, a: -1 },
            presetControls: [],
          },
          {
            prompt: "A narrower curve: set k for the close crossings.",
            fade: "autonomous",
            target: { x1: 1.5, y1: 0, x2: 2.5, y2: 0, a: 2 },
            presetControls: [],
          },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Crossings further apart need a deeper vertex.",
        spacedReviewPrompt: "Set k so the curve crosses at both rings.",
        reviewOnSuccess: "One and a half steps each side of the axis: k is −2.25.",
        reviewTarget: { x1: 0.5, y1: 0, x2: 3.5, y2: 0 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-equation-intersection-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 12,
    title: "Equations are crossings",
    interactive: "line-intersection",
    estimatedMinutes: 4,
    status: "published",
    spec: {
      targetSkill: "Solving an equation means finding where two lines meet.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A climbing line and a flat line approach each other; a marker drops from their crossing point to the floor.",
        caption: "Where two paths cross, they share one spot.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Climbing line", colorToken: "blue" },
          { label: "Flat line", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Raise the flat line. Follow the crossing point.",
        controls: [
          {
            controlType: "slider",
            variableName: "c",
            label: "Flat line height",
            min: 1,
            max: 11,
            step: 1,
            initial: 5,
            colorToken: "amber",
            visualSignaling: "The crossing point and its shadow on the floor move together",
          },
        ],
        spatialContiguityRules: [
          "Crossing coordinates sit next to the crossing point",
          "Flat line height sits at its left end",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Drop a marker where the lines will cross.",
        userAction: "Drag the floor marker to the predicted crossing, then reveal",
        target: { m: 2, b: 1, c: 7 },
        tolerance: 0.25,
        adaptiveFeedback: {
          onCommonMisconception: "The shaded gap shows how far your marker is from the crossing.",
          onSuccess: "Both lines reach height 7 at the same spot.",
        },
      },
      stage4Formalization: {
        formalExpression: "2x + 1 = 7  →  x = 3",
        caption: "Solving an equation is finding where two lines meet.",
        colorMapping: [
          { symbol: "2x + 1", matchesVisual: "Climbing line", colorToken: "blue" },
          { symbol: "7", matchesVisual: "Flat line", colorToken: "amber" },
          { symbol: "x = 3", matchesVisual: "Crossing point", colorToken: "emerald" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "A steeper climbing line meets a higher flat line.",
        spacedReviewPrompt: "Drop a marker where the lines will cross.",
        reviewOnSuccess: "Both lines reach height 10 at x = 4.",
        reviewTarget: { m: 3, b: -2, c: 10 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-system-parallel-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 13,
    title: "When lines never meet",
    // New board from the line-intersection pieces: the second line has its own slope and height.
    interactive: "line-pair",
    estimatedMinutes: 4,
    status: "draft",
    spec: {
      targetSkill:
        "Two lines meet once, never (same steepness, different start) or everywhere (the same line): one, no or endless solutions.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "Two rails run side by side across the board without ever touching; then one tilts slightly and they cross at a single peg.",
        caption: "Same direction never meets. A tilt makes them cross.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Fixed line", colorToken: "blue" },
          { label: "Moving line", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Tilt and lift the moving line. Count the crossings.",
        controls: [
          {
            controlType: "slider",
            variableName: "m2",
            label: "Steepness",
            min: -3,
            max: 3,
            step: 1,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The moving line turns; its crossing slides away or disappears",
          },
          {
            controlType: "drag_handle",
            variableName: "b2",
            label: "Start height",
            min: -2,
            max: 6,
            step: 1,
            initial: 4,
            colorToken: "rose",
            visualSignaling: "The moving line lifts; with equal steepness the constant gap is labelled",
          },
        ],
        // The fixed line is y = 2x + 1, the same climbing line as in "Equations are crossings".
        fixed: { m: 2, b: 1 },
        spatialContiguityRules: [
          "The crossing count sits beside the crossing, or on the gap when there is none",
          "When the lines coincide, the whole shared line pulses",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "How many times will these two lines cross?",
        userAction: "Pick 0, 1 or endless before the lines are drawn, then reveal",
        // Same steepness, different start: no crossing.
        target: { m: 2, b: 1, m2: 2, b2: 4 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The gap between the lines is labelled at three spots: it never shrinks.",
          onSuccess: "Equal steepness, different starts: the gap stays 3, so they never meet.",
          byKind: {
            alwaysOne: "Lines with equal steepness keep the same gap forever; not every pair crosses.",
            endless: "Same steepness but different starts: two parallel lines, not one line.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "2x + 1 = 2x + 4  →  1 = 4: no solution",
        caption: "Same slope, different start: no solution. Same line: every x works.",
        colorMapping: [
          { symbol: "2x + 1", matchesVisual: "Fixed line", colorToken: "blue" },
          { symbol: "2x + 4", matchesVisual: "Moving line", colorToken: "amber" },
          { symbol: "1 = 4", matchesVisual: "The constant gap between them", colorToken: "rose" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Mix with equations-are-crossings: sometimes one crossing, sometimes none or endless.",
        spacedReviewPrompt: "How many times will these two lines cross?",
        reviewOnSuccess: "Same steepness and same start: one line, every point shared.",
        reviewTarget: { m: -1, b: 2, m2: -1, b2: 2 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-difference-of-squares-01",
    trackId: "mathematics",
    chapterId: "math-algebra",
    position: 14,
    title: "Cutting a square out",
    interactive: "difference-of-squares",
    estimatedMinutes: 4,
    status: "draft",
    spec: {
      targetSkill: "a² − b² rearranges into an (a + b) by (a − b) rectangle.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A small square is cut from a big square's corner; the leftover L-shape slides into one rectangle.",
        caption: "Cut a corner out, then rebuild a rectangle.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Big side a", colorToken: "blue" },
          { label: "Cut side b", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Resize the cut. Watch the rectangle reshape.",
        controls: [
          {
            controlType: "slider",
            variableName: "a",
            label: "a",
            min: 3,
            max: 9,
            step: 1,
            initial: 6,
            colorToken: "blue",
            visualSignaling: "The rebuilt rectangle's long side pulses",
          },
          {
            controlType: "slider",
            variableName: "b",
            label: "b",
            min: 1,
            max: 2,
            step: 1,
            initial: 2,
            colorToken: "rose",
            visualSignaling: "The cut square and the short side pulse",
          },
        ],
        spatialContiguityRules: ["Side lengths sit on the rectangle edges they measure"],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Predict the rectangle's sides before it rebuilds.",
        userAction: "Set the long and short side of the rebuilt rectangle",
        target: { a: 7, b: 3 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The overlap shows where your rectangle and the L-shape differ.",
          onSuccess: "Same area, new shape: (a + b) by (a − b).",
        },
      },
      stage4Formalization: {
        formalExpression: "a² − b² = (a + b)(a − b)",
        caption: "Removing a square leaves a rectangle in disguise.",
        colorMapping: [
          { symbol: "a²", matchesVisual: "Big square", colorToken: "blue" },
          { symbol: "b²", matchesVisual: "Cut corner", colorToken: "rose" },
          { symbol: "(a + b)(a − b)", matchesVisual: "Rebuilt rectangle", colorToken: "emerald" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Mix with the square of a sum: which identity fits?",
        spacedReviewPrompt: "Predict the rectangle's sides for a = 8, b = 3.",
        reviewOnSuccess: "Same area, new shape: 11 by 5.",
        reviewTarget: { a: 8, b: 3 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
];
