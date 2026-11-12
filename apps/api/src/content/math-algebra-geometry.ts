import type { LearningModuleInput, LearningTrackInput } from "@versado/validation";

/**
 * Track: Algebra through Geometry.
 * Visual and experimental first — every algebraic idea is anchored in a shape or a
 * coordinate plane the learner manipulates before seeing any notation.
 * Each module follows the YAML template in intuitive_interactive_learning.md §3.
 * Linear functions are taught in isolated blocks first (m alone, then c alone),
 * then combined, then practised with fading help (guided → assisted → autonomous).
 * Quadratics follow the same path: a alone, then the vertex (h, k), then the general form,
 * where b is read as the curve's lean at the crossing (the slope from the linear modules).
 */
export const mathTrack: LearningTrackInput = {
  id: "math-algebra-geometry",
  domain: "mathematics",
  title: "Algebra through Geometry",
  subtitle: "See it, move it, predict it — then write it.",
  description:
    "Build intuition for algebra with shapes and the coordinate plane: areas become products, squares reveal identities, and equations become lines that meet.",
  icon: "Shapes",
  colorToken: "blue",
  position: 0,
  status: "published",
};

export const mathModules: LearningModuleInput[] = [
  {
    id: "math-area-product-01",
    trackId: "math-algebra-geometry",
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
        reviewTarget: { a: 3, area: 21 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-binomial-square-01",
    trackId: "math-algebra-geometry",
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
        userAction: "Enter the total area of the big square, then reveal",
        target: { a: 3, b: 2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dashed strips are the pieces your answer left out.",
          onSuccess: "Two squares plus two strips — every piece counted.",
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
        reviewTarget: { a: 5, b: 1 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-linear-slope-01",
    trackId: "math-algebra-geometry",
    position: 2,
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
        reviewTarget: { x1: 0, y1: 0, x2: 2, y2: 3 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-linear-intercept-01",
    trackId: "math-algebra-geometry",
    position: 3,
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
        reviewTarget: { x1: 1, y1: -1, x2: 2, y2: 0 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-slope-intercept-01",
    trackId: "math-algebra-geometry",
    position: 4,
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
        reviewTarget: { x1: 0, y1: 4, x2: 2, y2: 0 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-shape-01",
    trackId: "math-algebra-geometry",
    position: 5,
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
        reviewTarget: { x1: 1, y1: 2 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-vertex-01",
    trackId: "math-algebra-geometry",
    position: 6,
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
        reviewTarget: { x1: 0, y1: 2, x2: 2, y2: 2, a: 1 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-general-01",
    trackId: "math-algebra-geometry",
    position: 7,
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
        reviewTarget: { x1: 0, y1: -1, x2: 1, y2: 2 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-quad-roots-01",
    trackId: "math-algebra-geometry",
    position: 8,
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
        reviewTarget: { x1: 0.5, y1: 0, x2: 3.5, y2: 0 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-equation-intersection-01",
    trackId: "math-algebra-geometry",
    position: 9,
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
        reviewTarget: { m: 3, b: -2, c: 10 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-difference-of-squares-01",
    trackId: "math-algebra-geometry",
    position: 10,
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
        reviewTarget: { a: 8, b: 3 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
];
