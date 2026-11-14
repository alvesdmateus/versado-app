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
 *
 * Draft interactive contracts (content only; these boards are not implemented yet):
 * Common: A = [a b; c d], column vectors, positive turns anticlockwise. Each mode
 * commits a prediction before animating it; hide live answers during prediction.
 * Prediction/review/practice target context overrides fixed parameters only for
 * that task. Never merge expected answer coordinates into the learner's input.
 * All rails also have in-plane handles. Choices use stable answer ids even when
 * shuffled: 0 = actual result, 1 = the named misconception described below.
 * Assisted tasks lock presetControls but leave the prediction response editable.
 *
 * matrix-turn: a grid, both basis arrows and an F flag rotate together.
 * Modes: explore turn; predict/review a marked point's landing; faded practice.
 * Bind turn -> slider, quarter turns (-2..2, step 1); px/py are the source point.
 * Prediction replaces the slider with x/y marker rails (-4..4, step 1, initial 0).
 * evaluate reads target x/y; turn/px/py configure the frozen case. It checks the
 * marker against R(turn)(px,py), never against the exploration slider's value.
 * Named kinds: clockwise = R(-turn)p; swap = (py,px), omitting the sign change.
 *
 * matrix-order: two linked grids carry the same F flag through opposite orders.
 * Modes: compare orders; predict/review the selected order; faded practice.
 * Bind order -> toggle (0 = stretch then turn, 1 = turn then stretch).
 * Fixed a/d set the diagonal stretch; turn/px/py set the turn and marked point.
 * Prediction uses x/y marker rails (-4..4, step 1, initial 0), with order frozen.
 * evaluate reads x/y; order is case context. Compute R*S*p for 0, S*R*p for 1.
 * Named kind reversed = the other order's landing. Keep its ghost flag hidden
 * until commitment, so the comparison view cannot disclose the prediction.
 *
 * matrix-area: basis arrows and a signed tile on a grid.
 * Modes inferred from controls: a+d = diagonal area; angle = line collapse.
 * Diagonal binds a -> x rail, d -> y rail (-3..3, step 0.25); b=c=0 stay fixed.
 * evaluate reads area and compares input.a*input.d with it using tolerance;
 * accept every matching pair, not a canonical a/d pair. Assisted targets also
 * supply a as a solved preset, leaving d free. Amber area turns violet when
 * negative; the magnitude is physical area, the sign records orientation.
 * Collapse binds angle -> slider (0..180 degrees, step 5); fixed firstAngle,
 * firstLength and secondLength define the two nonzero arrows. angle rotates
 * only the second arrow. evaluate reads angle modulo 180 relative to firstAngle;
 * review/task firstAngle can replace fixed firstAngle. Reveal coincident source
 * dots to show lost information. Assisted collapse locks angle and asks a result
 * choice: answer 0 = overlapping landings, 1 = separate landings (thin).
 * Named kinds: unsigned (diagonal); thin, perpendicular (collapse).
 *
 * matrix-inverse: a fixed diagonal forward warp, its trails and an undo frame.
 * Modes: rewind exploration; singular demonstration; undo prediction/review.
 * Bind rewind -> slider (-1..1, step 0.1): 1 forward, 0 original, -1 inverse,
 * using positive diagonal powers between them. singular -> toggle (0/1) sets
 * forward d=0 and shows merged dots; block inverse playback in this state.
 * Prediction removes both exploration controls and singular mode; bind undo
 * a -> x rail, d -> y rail (-4..4, step 1/12, initial 1). Fixed a/d describe
 * the forward map; target a/d describe the learner's undo, not a new forward map.
 * forwardA/forwardD in review/practice override the forward map, never undo input.
 * evaluate reads target a/d with tolerance in undo units; the reveal shows their
 * products with the forward factors returning to 1. Named kinds:
 * negate = (-forwardA,-forwardD),
 * same = (forwardA,forwardD), subtract = (1-forwardA,1-forwardD).
 *
 * matrix-system: an input arrow, its transformed shadow and a fixed target pin.
 * Modes: explore; hidden-shadow prediction/review; faded practice; singular
 * comparison (A=[1 1;0 0]: pin (2,0) has many inputs, pin (2,1) has none).
 * Bind x -> x rail, y -> y rail (-4..4, step 0.5). Fixed a/b/c/d set A,
 * bx/by set the target pin; task bx/by override it. evaluate reads target x/y
 * in the nonsingular tasks and verifies Ax=(bx,by); never drag the target pin.
 * Named kind destination = entered (bx,by) as the input instead of solving.
 *
 * matrix-eigenvector: a probe arrow, its original track and its warped landing.
 * Modes: explore; predict an invariant line; review another line with a flip.
 * Bind probeAngle -> slider (0..355 degrees, step 5); fixed a/b/c/d set A.
 * evaluate reads probeAngle as a representative, accepting ANY nonzero probe
 * whose output lies on the same line (parallel or antiparallel), within the
 * angular tolerance. excludeAngle in review excludes the previously found line
 * modulo 180; task a/b/c/d override A. Keep the output hidden until commitment.
 * Assisted practice locks probeAngle and asks a landing choice: answer 0 = A*v,
 * 1 = an equal-length sideways landing (sideways). Negative factors stay valid.
 * Named kind sideways; do not reject a flip as a direction error.
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
    position: 15,
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
    position: 16,
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
    position: 17,
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
    position: 18,
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
    position: 19,
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
  {
    id: "math-matrix-rotation-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 20,
    title: "Turning the plane",
    interactive: "matrix-turn",
    estimatedMinutes: 4,
    prerequisites: ["math-matrix-columns-01"],
    status: "draft",
    spec: {
      targetSkill: "A rotation matrix turns both basis arrows together; every point follows the same turn.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A floor carrying a flag turns around its centre. The flag and the arrows painted on the floor turn together without changing shape.",
        caption: "Turn the floor. The flag rides along.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Across arrow", colorToken: "blue" },
          { label: "Up arrow", colorToken: "amber" },
          { label: "Marked dot", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Turn both arrows. Watch the flag follow.",
        controls: [
          {
            controlType: "slider",
            variableName: "turn",
            label: "Quarter turns",
            min: -2,
            max: 2,
            step: 1,
            initial: 0,
            colorToken: "slate",
            visualSignaling: "Both arrows sweep together; the flag and marked dot trace matching arcs at 60fps",
          },
        ],
        fixed: { px: 2, py: 1 },
        spatialContiguityRules: [
          "Draw the turn arc at the shared arrow base, with its direction attached",
          "Keep the marked dot's address beside the dot, not in a legend",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Mark the dot's landing after the shown turn.",
        userAction: "With the turn frozen and landing hidden, place the marker using its x/y rails, commit, then reveal",
        target: { turn: 1, x: -1, y: 2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dotted arc ends at the landing; the rose gap shows your miss.",
          onSuccess: "The dot followed both arrows around the centre, landing at (−1, 2).",
          byKind: {
            clockwise: "Your dot followed the opposite arc. Follow the shown turn direction.",
            swap: "Swapping distances misses the leftward step. The turned up arrow points left.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "î → (0, 1),  ĵ → (−1, 0),  (x, y) → (−y, x)",
        caption: "A quarter turn moves both arrows; the point keeps its recipe.",
        colorMapping: [
          { symbol: "(0, 1)", matchesVisual: "Turned across arrow", colorToken: "blue" },
          { symbol: "(−1, 0)", matchesVisual: "Turned up arrow", colorToken: "amber" },
          { symbol: "(−y, x)", matchesVisual: "Marked dot's landing", colorToken: "rose" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Keep the same quarter turn but start the marked dot left of the centre.",
        spacedReviewPrompt: "Mark this dot's landing after the shown turn.",
        reviewTarget: { turn: 1, px: -1, py: 2, x: -2, y: -1 },
        reviewOnSuccess: "The same turn carries this dot to (−2, −1).",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the arrows carry the dot around.", fade: "guided", target: { turn: 1, x: -1, y: 2 } },
          {
            prompt: "The turn is set. Finish the dot's landing.",
            fade: "assisted",
            target: { turn: 1, px: 1, py: 2, x: -2, y: 1 },
            presetControls: ["turn"],
          },
          { prompt: "Mark the landing before turning the floor.", fade: "autonomous", target: { turn: 1, px: -2, py: 1, x: -1, y: -2 } },
        ],
      },
    },
  },
  {
    id: "math-transform-order-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 21,
    title: "Order matters",
    interactive: "matrix-order",
    estimatedMinutes: 4,
    prerequisites: ["math-matrix-rotation-01"],
    status: "draft",
    spec: {
      targetSkill: "Stretching then turning can land a point differently from turning then stretching.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "Matching flags ride separate floors. A floor stretches wide and then turns; the other turns and then stretches wide. The flags finish with different shapes.",
        caption: "Same moves, different order. Watch where the flags finish.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Stretch", colorToken: "blue" },
          { label: "Turn", colorToken: "amber" },
          { label: "Marked dot", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Switch the order. Compare the flags' final shapes.",
        controls: [
          {
            controlType: "toggle",
            variableName: "order",
            label: "Which comes first?",
            stateLabels: ["Stretch first", "Turn first"],
            min: 0,
            max: 1,
            step: 1,
            initial: 0,
            colorToken: "slate",
            visualSignaling: "The selected flag immediately follows its ordered path; blue stretch and amber turn trails stay attached",
          },
        ],
        fixed: { a: 2, d: 1, turn: 1, px: 2, py: 1 },
        spatialContiguityRules: [
          "Pin the ordered move badges to the floor they control",
          "Keep the marked dot and its trail on the F flag throughout both steps",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Stretch, then turn. Mark where the flagged dot lands.",
        userAction: "Freeze stretch-then-turn, hide both final flags, place the landing marker with x/y rails, then run the two steps",
        target: { order: 0, x: -1, y: 4 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The two-step trail ends away from your marker; the rose gap joins them.",
          onSuccess: "The widened flag turns; its marked dot lands at (−1, 4).",
          byKind: {
            reversed: "Your marker matches turn-then-stretch. Follow the badges from the first step.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "R(Sv) ≠ S(Rv)",
        caption: "The rightmost move acts first. These orders give different landings.",
        colorMapping: [
          { symbol: "S", matchesVisual: "Wide stretch and its trail", colorToken: "blue" },
          { symbol: "R", matchesVisual: "Quarter turn and its arc", colorToken: "amber" },
          { symbol: "v", matchesVisual: "Marked dot on the flag", colorToken: "rose" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Use the same stretch and turn, but reverse their order before predicting the marked point.",
        spacedReviewPrompt: "Turn, then stretch. Mark where the flagged dot lands.",
        reviewTarget: { order: 1, x: -2, y: 2 },
        reviewOnSuccess: "The turned flag stretches sideways; its dot lands at (−2, 2).",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the dot follow both steps in order.", fade: "guided", target: { order: 0, x: -1, y: 4 } },
          {
            prompt: "Order set. Complete the dot's landing after both steps.",
            fade: "assisted",
            target: { order: 1, x: -2, y: 2 },
            presetControls: ["order"],
          },
          { prompt: "Follow the shown order. Mark the final landing.", fade: "autonomous", target: { order: 0, px: 1, py: 2, x: -2, y: 2 } },
        ],
      },
    },
  },
  {
    id: "math-determinant-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 22,
    title: "Stretching space",
    interactive: "matrix-area",
    estimatedMinutes: 4,
    prerequisites: ["math-transform-order-01"],
    status: "draft",
    spec: {
      targetSkill: "For a diagonal matrix, det(A) = a·d scales area; a negative product records an orientation flip.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A glowing square tile stretches into a wide rectangle. A side crosses the centre and the tile turns over, changing its glow.",
        caption: "Stretch the tile. Turn it over and its glow changes.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Across arrow", colorToken: "blue" },
          { label: "Up arrow", colorToken: "amber" },
          { label: "Turned-over tile", colorToken: "violet" },
        ],
      },
      stage2Exploration: {
        prompt: "Stretch either arrow. Watch the tile's size and glow.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "a",
            label: "Across stretch",
            min: -3,
            max: 3,
            step: 0.25,
            initial: 1,
            colorToken: "blue",
            visualSignaling: "The across edge follows its tip at 60fps; the area fill turns violet if the product becomes negative",
          },
          {
            controlType: "drag_handle",
            variableName: "d",
            label: "Up stretch",
            min: -3,
            max: 3,
            step: 0.25,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "The up edge follows its tip at 60fps; a signed area readout remains attached to the tile's centre",
          },
        ],
        fixed: { b: 0, c: 0 },
        spatialContiguityRules: [
          "Attach each signed stretch value to its arrow tip",
          "Keep the signed area inside the tile; at collapse, anchor it to the remaining segment",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Make the tile's signed area 3.",
        userAction: "Set the across and up rails without the live area readout, commit both stretches, then reveal their product",
        target: { area: 3 },
        tolerance: 0.05,
        adaptiveFeedback: {
          onCommonMisconception: "The shaded excess or missing strip shows how your tile differs from the target area.",
          onSuccess: "Your stretches multiply to 3; many different rectangles can cover this much area.",
          onSignError: "The size fits, but the tile is flipped. Check the signs of both arrows.",
          byKind: {
            unsigned: "The violet tile has reversed orientation. Its area magnitude hides that negative sign.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "det(A) = a·d − b·c",
        caption: "The product gives signed area here; a negative sign records a flip.",
        colorMapping: [
          { symbol: "a", matchesVisual: "Across arrow's signed stretch", colorToken: "blue" },
          { symbol: "d", matchesVisual: "Up arrow's signed stretch", colorToken: "amber" },
          { symbol: "b·c", matchesVisual: "zero here: no lean", colorToken: "slate" },
          { symbol: "det(A)", matchesVisual: "Turned-over tile's signed area", colorToken: "violet" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Find a flipped rectangle with signed area −2; either arrow may cross the centre.",
        spacedReviewPrompt: "Make the tile's signed area −2.",
        reviewTarget: { area: -2 },
        reviewOnSuccess: "The stretches multiply to −2; the tile covers twice the area and flips.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch different rectangles reach the same signed area.", fade: "guided", target: { area: 2 } },
          {
            prompt: "Across is set. Finish the tile's target area.",
            fade: "assisted",
            target: { a: 2, area: 3 },
            presetControls: ["a"],
          },
          { prompt: "Build a tile with the shown signed area.", fade: "autonomous", target: { area: -3 } },
        ],
      },
    },
  },
  {
    id: "math-singular-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 23,
    title: "Collapsing into a line",
    interactive: "matrix-area",
    estimatedMinutes: 4,
    prerequisites: ["math-determinant-01"],
    status: "draft",
    spec: {
      targetSkill: "Aligned matrix columns flatten the plane to a line: zero area merges distinct inputs and loses information.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 20 },
      stage1Anchoring: {
        visualMetaphor:
          "A glowing floor folds into a bright thread. Scattered dots ride the fold, and dots that began apart settle on the same spot.",
        caption: "The floor folds flat. Separate dots can land together.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "First arrow", colorToken: "blue" },
          { label: "Moving arrow", colorToken: "amber" },
          { label: "Flattened thread", colorToken: "slate" },
          { label: "Overlapping dots", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Turn the moving arrow. Watch the tile narrow.",
        controls: [
          {
            controlType: "slider",
            variableName: "angle",
            label: "Second arrow",
            min: 0,
            max: 180,
            step: 5,
            initial: 90,
            colorToken: "amber",
            visualSignaling: "The second arrow rotates at 60fps; the tile thins to a slate line when both arrows share a track",
          },
        ],
        fixed: { firstAngle: 45, firstLength: 2, secondLength: 2 },
        spatialContiguityRules: [
          "Draw the alignment arc between the two arrows at their shared base",
          "Pin the area readout to the tile or its collapsed line; show overlapping dots there",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Set the moving arrow before flattening the floor.",
        userAction: "Hide the tile and grid, set the second arrow's direction, commit, then reveal whether the plane collapses",
        target: { angle: 45 },
        tolerance: 1,
        adaptiveFeedback: {
          onCommonMisconception: "The highlighted sliver still separates the arrows; the floor has not flattened completely.",
          onSuccess: "Both arrows share a line. Separate source dots now overlap on it.",
          byKind: {
            thin: "A narrow tile still has area. Close the remaining gap between the arrows' tracks.",
            perpendicular: "The arrows cross at a corner. Flattening needs them on the same line.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "det(A) = 0 ⇒ Au = Av, u ≠ v",
        caption: "Zero area can merge different inputs. The flattened picture loses their separation.",
        colorMapping: [
          { symbol: "det(A) = 0", matchesVisual: "Collapsed tile with no thickness", colorToken: "slate" },
          { symbol: "A", matchesVisual: "The arrow pair defining the fold", colorToken: "blue" },
          { symbol: "Au = Av", matchesVisual: "Distinct source dots sharing a landing", colorToken: "rose" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Tilt the fixed first arrow the other way; find the second arrow direction that merges the dots again.",
        spacedReviewPrompt: "Set the moving arrow so the floor folds flat.",
        reviewTarget: { firstAngle: 135, angle: 135 },
        reviewOnSuccess: "The line tilted, but shared arrow tracks still flatten the floor and merge dots.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the arrows align and the dots merge.", fade: "guided", target: { angle: 45 } },
          {
            prompt: "Arrow set. Choose overlapping or separate dot landings.",
            fade: "assisted",
            target: { angle: 45, answer: 0 },
            presetControls: ["angle"],
          },
          { prompt: "Set the moving arrow before folding the floor.", fade: "autonomous", target: { firstAngle: 30, angle: 30 } },
        ],
      },
    },
  },
  {
    id: "math-inverse-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 24,
    title: "Undoing a move",
    interactive: "matrix-inverse",
    estimatedMinutes: 5,
    prerequisites: ["math-singular-01"],
    status: "draft",
    spec: {
      targetSkill: "A diagonal inverse uses reciprocal stretches to restore the original grid; a collapsed direction cannot be uniquely restored.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 24 },
      stage1Anchoring: {
        visualMetaphor:
          "A stretched floor rewinds along glowing trails until its tiles fit their old outlines. A crushed floor leaves merged dots with no separate trails home.",
        caption: "Rewind the stretch. Merged dots have lost their separate paths.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Forward stretch", colorToken: "blue" },
          { label: "Undo stretch", colorToken: "emerald" },
          { label: "Original frame", colorToken: "slate" },
        ],
      },
      stage2Exploration: {
        prompt: "Scrub the rewind. Try it after crushing the floor.",
        controls: [
          {
            controlType: "slider",
            variableName: "rewind",
            label: "Rewind",
            min: -1,
            max: 1,
            step: 0.1,
            initial: 1,
            colorToken: "emerald",
            visualSignaling: "Grid vertices follow attached trails at 60fps between the forward stretch, original frame and inverse stretch",
          },
          {
            controlType: "toggle",
            variableName: "singular",
            label: "Crush the floor",
            stateLabels: ["Keep it", "Crush it"],
            min: 0,
            max: 1,
            step: 1,
            initial: 0,
            colorToken: "slate",
            visualSignaling: "Crushing merges source dots and blocks inverse playback; their distinct original homes remain visible as ghosts",
          },
        ],
        fixed: { a: 2, b: 0, c: 0, d: 0.5 },
        spatialContiguityRules: [
          "Attach forward and undo stretch values to their own arrow tips",
          "Draw the original frame beneath the moving tile and trails directly between corresponding vertices",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Set the undo stretches to restore the original frame.",
        userAction: "Replace rewind and crush controls with undo a/d rails; set both, commit, then apply them to the fixed forward stretch",
        target: { a: 0.5, d: 2 },
        tolerance: 0.02,
        adaptiveFeedback: {
          onCommonMisconception: "The ghost frame shows where your undo still leaves the tile stretched or squeezed.",
          onSuccess: "Half across and twice up restore both edges to their original lengths.",
          byKind: {
            negate: "Negating flips the tile; its edges still miss the original frame.",
            same: "Repeating the forward stretch widens the mismatch. The ghost frame shows the extra stretch.",
            subtract: "Subtracting leaves the edges short or flipped. Undo must restore their original lengths.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "A⁻¹ = diag(1/a, 1/d),  A⁻¹A = I",
        caption: "Undo uses reciprocals. A collapsed direction has no unique way back.",
        colorMapping: [
          { symbol: "A", matchesVisual: "Fixed forward stretch", colorToken: "blue" },
          { symbol: "A⁻¹", matchesVisual: "Undo stretch", colorToken: "emerald" },
          { symbol: "1/a, 1/d", matchesVisual: "Undo arrow stretch values", colorToken: "emerald" },
          { symbol: "I", matchesVisual: "Restored original frame", colorToken: "slate" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Undo a different diagonal stretch: three times across and one quarter up. Compare with a collapsed direction that cannot rewind.",
        spacedReviewPrompt: "Restore this stretched tile to its original frame.",
        reviewTarget: { forwardA: 3, forwardD: 0.25, a: 1 / 3, d: 4 },
        reviewOnSuccess: "One third across and four times up restore this tile's original frame.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the undo stretches restore both edges.", fade: "guided", target: { a: 0.5, d: 2 } },
          {
            prompt: "Forward view set. Fit the undo tile to its frame.",
            fade: "assisted",
            target: { rewind: 1, forwardA: 2, forwardD: 2, a: 0.5, d: 0.5 },
            presetControls: ["rewind"],
          },
          { prompt: "Set both undo stretches before revealing the restored tile.", fade: "autonomous", target: { forwardA: 0.5, forwardD: 3, a: 2, d: 1 / 3 } },
        ],
      },
    },
  },
  {
    id: "math-linear-system-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 25,
    title: "Systems are intersections",
    interactive: "matrix-system",
    estimatedMinutes: 4,
    prerequisites: ["math-inverse-01"],
    status: "draft",
    spec: {
      targetSkill: "Solving Ax = b means choosing the input arrow whose transformed landing reaches the target b.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A movable arrow sweeps a floor. Its glowing shadow moves across a stretched floor beside it, approaching a waiting target pin.",
        caption: "Move the arrow. Its shadow hunts for the pin.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Input arrow", colorToken: "blue" },
          { label: "Moving shadow", colorToken: "amber" },
          { label: "Target pin", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Move the input. Watch its shadow approach the pin.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "x",
            label: "Input across",
            min: -4,
            max: 4,
            step: 0.5,
            initial: 0,
            colorToken: "blue",
            visualSignaling: "Moving the input horizontally updates its amber transformed shadow and the target gap at 60fps",
          },
          {
            controlType: "drag_handle",
            variableName: "y",
            label: "Input up",
            min: -4,
            max: 4,
            step: 0.5,
            initial: 0,
            colorToken: "blue",
            visualSignaling: "Moving the input vertically updates its amber transformed shadow along the second column's direction at 60fps",
          },
        ],
        fixed: { a: 2, b: 1, c: 0, d: 1, bx: 3, by: 1 },
        spatialContiguityRules: [
          "Keep input coordinates on the blue tip and output coordinates on the amber shadow",
          "Draw the discrepancy segment directly from the shadow tip to the rose target pin",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Place the input so its shadow reaches the pin.",
        userAction: "Hide the moving shadow, drag the input's x/y handle or rails, commit the input, then run the fixed map",
        target: { x: 1, y: 1 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The dashed rose gap joins your shadow's landing to the waiting target pin.",
          onSuccess: "Input (1, 1) sends its shadow to the pin at (3, 1).",
          byKind: {
            destination: "You put the input at the pin. Its shadow moves again and overshoots.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "Ax⃗ = b⃗  ⇒  x⃗ = A⁻¹b⃗",
        caption: "Each equation constrains the same input. Their intersection sends the shadow to the pin.",
        colorMapping: [
          { symbol: "A", matchesVisual: "Fixed transformation's grid", colorToken: "slate" },
          { symbol: "x⃗", matchesVisual: "Input arrow's across and up steps", colorToken: "blue" },
          { symbol: "Ax⃗", matchesVisual: "Transformed shadow", colorToken: "amber" },
          { symbol: "b⃗", matchesVisual: "Target pin's coordinates", colorToken: "rose" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Review a new pin with a leftward input. Then compare a collapsed map: pins on its line have many inputs; pins off it have none.",
        spacedReviewPrompt: "Find the input whose shadow reaches this new pin.",
        reviewTarget: { bx: 0, by: 2, x: -1, y: 2 },
        reviewOnSuccess: "Input (−1, 2) sends its shadow to the new pin at (0, 2).",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the input and its shadow reach the pin.", fade: "guided", target: { bx: 3, by: 1, x: 1, y: 1 } },
          {
            prompt: "Across is set. Finish the input's upward step.",
            fade: "assisted",
            target: { bx: 3, by: -1, x: 2, y: -1 },
            presetControls: ["x"],
          },
          { prompt: "Place the input before revealing its shadow.", fade: "autonomous", target: { bx: -3, by: 1, x: -2, y: 1 } },
        ],
      },
    },
  },
  {
    id: "math-eigenvector-01",
    trackId: "mathematics",
    chapterId: "math-vectors",
    position: 26,
    title: "The axes that stay on track",
    interactive: "matrix-eigenvector",
    estimatedMinutes: 4,
    prerequisites: ["math-linear-system-01"],
    status: "draft",
    spec: {
      targetSkill: "Eigenvectors mark lines that a matrix preserves: their arrows stretch or flip along that line without moving sideways.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 24 },
      stage1Anchoring: {
        visualMetaphor:
          "A wheel of arrows rides a shifting floor. Most tips swing sideways, while a few slide along their old glowing tracks.",
        caption: "Some arrows stay on their own tracks as the floor shifts.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Sideways arrows", colorToken: "slate" },
          { label: "On-track arrow", colorToken: "amber" },
          { label: "Length change", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Turn the probe. Look for a landing on its track.",
        controls: [
          {
            controlType: "slider",
            variableName: "probeAngle",
            label: "Probe direction",
            min: 0,
            max: 355,
            step: 5,
            initial: 20,
            colorToken: "amber",
            visualSignaling: "The probe rotates at 60fps; its track glows amber on alignment, with an emerald signed stretch factor at the output tip",
          },
        ],
        fixed: { a: 1.5, b: 0.5, c: 0.5, d: 1.5 },
        spatialContiguityRules: [
          "Attach the signed length factor to the output arrow tip",
          "Draw the rose sideways deviation between the output and the probe's original line",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Set the probe before testing whether it stays on track.",
        userAction: "Hide the output and alignment glow, commit the probe angle, then run the warp and compare its landing to the original line",
        target: { probeAngle: 45 },
        tolerance: 1,
        adaptiveFeedback: {
          onCommonMisconception: "The rose gap shows the output leaving your probe's original line.",
          onSuccess: "The output stays on the probe's original line; only its length changes.",
          byKind: {
            sideways: "A matching length is not enough. The output must stay on the original line.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "Av = λv",
        caption: "An eigenvector stays on its line; its eigenvalue gives the signed stretch.",
        colorMapping: [
          { symbol: "A", matchesVisual: "The fixed grid warp", colorToken: "blue" },
          { symbol: "v", matchesVisual: "On-track probe arrow", colorToken: "amber" },
          { symbol: "λ", matchesVisual: "Signed length factor at the output tip", colorToken: "emerald" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Find another preserved line with a flip. Contrast a quarter turn (no preserved real lines) with a half turn (every line preserved).",
        spacedReviewPrompt: "Find another track, even if the arrow flips along it.",
        reviewTarget: { a: 0.5, b: 1.5, c: 1.5, d: 0.5, probeAngle: 135, excludeAngle: 45 },
        reviewOnSuccess: "The output flips along this second line. A reversed arrow still stays on track.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch a probe stretch along its original track.", fade: "guided", target: { probeAngle: 45 } },
          {
            prompt: "Direction set. Choose the output tip's landing.",
            fade: "assisted",
            target: { probeAngle: 45, answer: 0 },
            presetControls: ["probeAngle"],
          },
          { prompt: "Find another direction that stays on its own track.", fade: "autonomous", target: { probeAngle: 135, excludeAngle: 45 } },
        ],
      },
    },
  },
];
