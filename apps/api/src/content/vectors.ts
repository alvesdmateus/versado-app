import type { LearningChapterInput, LearningModuleInput } from "@versado/validation";

/**
 * Chapter: Vectors & matrices — the coordinate plane as a place to move in.
 * Building blocks first, each one manipulated before it is named:
 *  1. a point is an address (across, then up — order matters);
 *  2. a vector is a move (the same from any start), the step from a place to another;
 *  3. moves chain into trajectories, and two moves equal one shortcut (addition);
 *  4. a matrix moves the two unit arrows — the whole plane follows (stretch first, alone);
 *  5. a point is a recipe of those arrows, so its image is the same recipe of the landed arrows.
 * Each module follows the YAML template in intuitive_interactive_learning.md §3.
 */
export const vectorsChapter: LearningChapterInput = {
  id: "math-vectors",
  trackId: "mathematics",
  position: 1,
  title: "Vectors & matrices",
  subtitle: "Points are places, vectors are moves, matrices reshape the whole plane.",
  description:
    "Walk the coordinate plane: give a place its address, turn moves into arrows, chain them into trips, then bend the whole plane with a matrix.",
  status: "published",
};

export const vectorsModules: LearningModuleInput[] = [
  {
    id: "math-point-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 11,
    title: "A point is an address",
    interactive: "plane-point",
    estimatedMinutes: 3,
    // Only needs the plane, not the algebra chapter: open as soon as the course is started.
    prerequisites: ["math-area-product-01"],
    status: "published",
    spec: {
      targetSkill: "A point is an address on the plane: steps across first, then steps up.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A token leaves the centre, walks along the floor, turns and climbs, then leaves a dot; it repeats to a second spot below the floor.",
        caption: "Walk across, then up. Where you stop is an address.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Across", colorToken: "blue" },
          { label: "Up", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Slide across and up. The dot follows both.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "x",
            label: "Across",
            min: -4,
            max: 4,
            step: 1,
            initial: 2,
            colorToken: "blue",
            visualSignaling: "The across walk along the floor flashes blue",
          },
          {
            controlType: "drag_handle",
            variableName: "y",
            label: "Up",
            min: -4,
            max: 4,
            step: 1,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The climb from the floor to the dot flashes amber",
          },
        ],
        spatialContiguityRules: [
          "Across count sits on the floor walk",
          "Up count sits beside the climb",
          "The address sits next to the dot",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Walk 3 across, then 2 down. Place the dot.",
        userAction: "Drag the dot (or its rails) to the address, then check",
        target: { x: 3, y: -2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The red walk shows where the address really leads.",
          onSuccess: "3 across, 2 down: that spot is (3, −2).",
          onSignError: "Right distances, wrong direction. Negative means left or down.",
          byKind: {
            swap: "Across and up are swapped. Across always comes first.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "(x, y) = (3, −2)",
        caption: "An ordered pair: across first, then up.",
        colorMapping: [
          { symbol: "x", matchesVisual: "Steps across the floor", colorToken: "blue" },
          { symbol: "y", matchesVisual: "Steps up (or down)", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Address left of and above the centre: both directions change.",
        spacedReviewPrompt: "Walk 2 left, then 4 up. Place the dot.",
        reviewOnSuccess: "2 left, 4 up: that spot is (−2, 4).",
        reviewTarget: { x: -2, y: 4 },
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch: 1 left, then 3 up.", fade: "guided", target: { x: -1, y: 3 } },
          {
            prompt: "Across is set. Now go 3 down.",
            fade: "assisted",
            target: { x: 4, y: -3 },
            presetControls: ["x"],
          },
          { prompt: "Place the dot 4 left, 1 down.", fade: "autonomous", target: { x: -4, y: -1 } },
        ],
      },
    },
  },
  {
    id: "math-vector-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 12,
    title: "A vector is a move",
    interactive: "vector-move",
    estimatedMinutes: 4,
    status: "published",
    spec: {
      targetSkill: "A vector is a move — how far across and how far up — the same from any start.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "One arrow carries a token across the plane; then the very same arrow is stamped from three other starting spots.",
        caption: "Same move, different starts. Same arrow every time.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Across", colorToken: "blue" },
          { label: "Up", colorToken: "amber" },
          { label: "The move", colorToken: "violet" },
        ],
      },
      stage2Exploration: {
        prompt: "Shape the move. Every copy changes with it.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "dx",
            label: "Across",
            min: -4,
            max: 4,
            step: 1,
            initial: 3,
            colorToken: "blue",
            visualSignaling: "The across leg under the arrow flashes blue on every copy",
          },
          {
            controlType: "drag_handle",
            variableName: "dy",
            label: "Up",
            min: -4,
            max: 4,
            step: 1,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The up leg beside the arrow flashes amber on every copy",
          },
        ],
        spatialContiguityRules: [
          "Across count sits on the across leg",
          "Up count sits on the up leg",
          "Copies carry no numbers: they mirror the main arrow",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Shape the move that carries the dot to the flag.",
        userAction: "Drag the arrow's tip (or its rails) to set across and up, then check where it lands",
        target: { ax: -2, ay: -1, bx: 2, by: 2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The red gap shows how far your move lands from the flag.",
          onSuccess: "4 across, 3 up carries the dot to the flag.",
          onSignError: "Right size, wrong way. Follow the dashed red move.",
          byKind: {
            position: "That is the flag's address. A move counts steps from the dot.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "v = (Δx, Δy) = B − A",
        caption: "A vector lists the steps of a move. Where it starts doesn't matter.",
        colorMapping: [
          { symbol: "Δx", matchesVisual: "Across leg of the arrow", colorToken: "blue" },
          { symbol: "Δy", matchesVisual: "Up leg of the arrow", colorToken: "amber" },
          { symbol: "v", matchesVisual: "The arrow itself", colorToken: "violet" },
          { symbol: "B", matchesVisual: "The flag", colorToken: "rose" },
          { symbol: "A", matchesVisual: "The starting dot", colorToken: "slate" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Flag below and left of the dot: both steps are negative.",
        spacedReviewPrompt: "Shape the move from the dot to the flag.",
        reviewOnSuccess: "3 left, 3 down: the move is (−3, −3).",
        reviewTarget: { ax: 1, ay: 2, bx: -2, by: -1 },
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch: count across, then up, from the dot.", fade: "guided", target: { ax: -3, ay: 0, bx: 1, by: 2 } },
          {
            prompt: "Across is set. Finish the move to the flag.",
            fade: "assisted",
            target: { ax: 2, ay: 2, bx: -1, by: -2 },
            presetControls: ["dx"],
          },
          { prompt: "Shape the move to the flag.", fade: "autonomous", target: { ax: -1, ay: 3, bx: 2, by: -1 } },
        ],
      },
    },
  },
  {
    id: "math-vector-sum-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 13,
    title: "Moves add up",
    interactive: "vector-path",
    estimatedMinutes: 4,
    status: "published",
    spec: {
      targetSkill: "Two moves in a row equal one shortcut: add across to across, up to up.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A token takes a two-leg trip, one arrow then another tip to tail; a straight shortcut then sweeps from the start to the same finish.",
        caption: "Two moves, one trip. The shortcut lands in the same place.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "First move", colorToken: "blue" },
          { label: "Second move", colorToken: "amber" },
          { label: "Shortcut", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Bend the second move. Watch the shortcut follow.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "vx",
            label: "2nd across",
            min: -4,
            max: 4,
            step: 1,
            initial: 2,
            colorToken: "amber",
            visualSignaling: "The shortcut's across leg grows with the second move's",
          },
          {
            controlType: "drag_handle",
            variableName: "vy",
            label: "2nd up",
            min: -4,
            max: 4,
            step: 1,
            initial: -2,
            colorToken: "amber",
            visualSignaling: "The shortcut's up leg grows with the second move's",
          },
        ],
        // The first move is held still so only the second one changes the trip.
        fixed: { ux: 3, uy: 2 },
        spatialContiguityRules: [
          "Each move's steps sit on its own arrow",
          "The shortcut's steps sit on the shortcut",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Build the one-move shortcut for both moves.",
        userAction:
          "The second move floats apart from the first; drag the shortcut's tip to where the trip would end, then check",
        target: { ux: 2, uy: 3, vx: 3, vy: -1 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The second move snaps onto the first. The red gap is your miss.",
          onSuccess: "2 + 3 across, 3 − 1 up: the shortcut is (5, 2).",
          onSignError: "You took the second move backwards. Chain it tip to tail.",
          byKind: {
            partial: "That shortcut skips a move. Chain the second onto the first's tip.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "u + v = (u₁ + v₁, u₂ + v₂)",
        caption: "Add across to across and up to up. That's the shortcut.",
        colorMapping: [
          { symbol: "u", matchesVisual: "First move", colorToken: "blue" },
          { symbol: "u₁", matchesVisual: "First move across", colorToken: "blue" },
          { symbol: "u₂", matchesVisual: "First move up", colorToken: "blue" },
          { symbol: "v", matchesVisual: "Second move", colorToken: "amber" },
          { symbol: "v₁", matchesVisual: "Second move across", colorToken: "amber" },
          { symbol: "v₂", matchesVisual: "Second move up", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "The second move points back left: across steps cancel partly.",
        spacedReviewPrompt: "Build the one-move shortcut for both moves.",
        reviewOnSuccess: "−2 + 4 across, 2 + 1 up: the shortcut is (2, 3).",
        reviewTarget: { ux: -2, uy: 2, vx: 4, vy: 1 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
  {
    id: "math-matrix-stretch-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 14,
    title: "A matrix reshapes the plane",
    interactive: "matrix-transform",
    estimatedMinutes: 4,
    status: "published",
    spec: {
      targetSkill: "A matrix moves the two unit arrows; the grid and every shape on it follow.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A grid carrying an F-shaped flag stretches wide, squashes tall, then flips upside down; the flag rides along with the grid.",
        caption: "Stretch the floor. Every shape drawn on it stretches too.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Across arrow", colorToken: "blue" },
          { label: "Up arrow", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Stretch the two arrows. The grid and flag follow.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "a",
            label: "Across arrow",
            min: -3,
            max: 3,
            step: 0.5,
            initial: 2,
            colorToken: "blue",
            visualSignaling: "Vertical grid lines spread or squeeze with the across arrow",
          },
          {
            controlType: "drag_handle",
            variableName: "d",
            label: "Up arrow",
            min: -3,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "Horizontal grid lines spread or squeeze with the up arrow",
          },
        ],
        // Stretch alone: neither arrow leans yet.
        fixed: { b: 0, c: 0 },
        spatialContiguityRules: [
          "Each arrow's length sits at its tip",
          "The flag rides on the moving grid",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Stretch the arrows so the flag fills the outline.",
        userAction: "Drag each arrow's tip (or its rail) to reshape the flag, then check against the outline",
        target: { a: 2, b: 0, c: 0, d: -1 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The red outline marks where the flag still misses.",
          onSuccess: "Twice as wide, flipped upside down: the flag fits.",
          onSignError: "Right size, flipped the wrong way. A negative arrow mirrors.",
          byKind: {
            swap: "Width and height are swapped. Across stretches width, up stretches height.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "M = [ a 0 ; 0 d ]",
        caption: "Each column is where an arrow lands: across first, then up.",
        colorMapping: [
          { symbol: "a", matchesVisual: "Where the across arrow lands", colorToken: "blue" },
          { symbol: "d", matchesVisual: "Where the up arrow lands", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Mirror left-right instead of up-down, and stretch the height.",
        spacedReviewPrompt: "Stretch the arrows so the flag fills the outline.",
        reviewOnSuccess: "Mirrored left to right and twice as tall: the flag fits.",
        reviewTarget: { a: -1, b: 0, c: 0, d: 2 },
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch: three times wider, half as tall.", fade: "guided", target: { a: 3, b: 0, c: 0, d: 0.5 } },
          {
            prompt: "Across is set. Now fit the height.",
            fade: "assisted",
            target: { a: 1.5, b: 0, c: 0, d: -2 },
            presetControls: ["a"],
          },
          { prompt: "Stretch the arrows to fit the outline.", fade: "autonomous", target: { a: -2, b: 0, c: 0, d: 1.5 } },
        ],
      },
    },
  },
  {
    id: "math-matrix-columns-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 15,
    title: "Points are recipes",
    interactive: "matrix-transform",
    estimatedMinutes: 5,
    status: "published",
    spec: {
      targetSkill:
        "A point is a recipe of the two arrows; after a matrix, follow the same recipe with the landed arrows.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 25 },
      stage1Anchoring: {
        visualMetaphor:
          "A dot is reached by two across arrows then one up arrow; the up arrow leans over and the dot, following the same steps, slides with it.",
        caption: "Two across arrows, one up arrow. Lean an arrow, the dot follows.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Across arrow", colorToken: "blue" },
          { label: "Up arrow", colorToken: "amber" },
          { label: "The dot", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Lean the up arrow. The dot keeps its recipe.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "b",
            label: "Lean",
            min: -2,
            max: 2,
            step: 0.5,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The up arrow's tip slides sideways and the whole grid shears with it",
          },
          {
            controlType: "drag_handle",
            variableName: "d",
            label: "Height",
            min: -2,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The up arrow grows or shrinks and the grid's rows follow",
          },
        ],
        // The across arrow stays put while the up arrow is explored alone; the dot's recipe is (2, 1).
        fixed: { a: 1, c: 0, px: 2, py: 1 },
        spatialContiguityRules: [
          "Recipe steps are drawn as arrow copies leading to the dot",
          "The dot's landing spot sits next to the dot",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "The arrows moved. Mark where the dot lands.",
        userAction:
          "Both arrows show where they land; the grid stays hidden. Drag the marker to the dot's new spot, then reveal",
        target: { a: 1, c: 1, b: -1, d: 2, px: 2, py: 1 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Follow the recipe on the new arrows: the red gap is your miss.",
          onSuccess: "Two new across arrows, one new up arrow: the dot lands at (1, 4).",
          byKind: {
            unmoved: "The dot moves with the arrows. Rebuild its recipe on the new ones.",
            transpose: "You mixed the arrows' steps. Use each arrow whole: across arrow twice.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "M·(x, y) = x·(a, c) + y·(b, d)",
        caption: "A point is a recipe: x across arrows plus y up arrows.",
        colorMapping: [
          { symbol: "x", matchesVisual: "How many across arrows", colorToken: "rose" },
          { symbol: "y", matchesVisual: "How many up arrows", colorToken: "rose" },
          { symbol: "(a, c)", matchesVisual: "Where the across arrow lands", colorToken: "blue" },
          { symbol: "(b, d)", matchesVisual: "Where the up arrow lands", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "A different recipe on a stretch-and-shear: one across arrow, two up arrows.",
        spacedReviewPrompt: "The arrows moved. Mark where the dot lands.",
        reviewOnSuccess: "One new across arrow, two new up arrows: the dot lands at (4, 2).",
        reviewTarget: { a: 2, c: 0, b: 1, d: 1, px: 1, py: 2 },
        reviewIntervalsDays: [1, 7],
      },
    },
  },
];
