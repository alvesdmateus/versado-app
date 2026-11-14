import type { LearningChapterInput, LearningModuleInput } from "@versado/validation";

/**
 * Interactive contract (draft boards; no client implementation yet).
 * All predictions freeze the dependent readouts/animation until commitment; only
 * the requested goal or ghost remains visible. Feedback overlays appear afterward.
 * Practice fades guided -> assisted -> autonomous. In single-angle lessons the
 * assisted item locks theta and substitutes one computed-result multiple choice;
 * it never asks learners to adjust a locked handle. An `answer` target always
 * means a numeric choice value, not an option index; choices come from the named
 * misconceptions below. Render only the prompt, labels and readouts needed for
 * the current micro-scene, within its onScreenWordLimit.
 *
 * circle-trig: a circle centred at the origin, counterclockwise from the right,
 * with a rim bead, projections, optional ribbon, wall and attached squares.
 * fixed.mode: 0 = wrapped ribbon, 1 = shadows, 2 = tangent wall, 3 = squares.
 * Bind theta (radians) -> drag_handle constrained to the rim, NOT an x/y rail;
 * provide a keyboard angular slider for the same value. Radius is fixed, never
 * another exposed control. Angular steps are pi/180; evaluate allows the stated
 * absolute angular tolerance, including targets between ticks (e.g. 3 radians).
 * Mode 0: fixed.radius = 1; review uses reviewRadius = 2 and reviewDistance = 6.
 * Read s = radius * theta. Hide pi/endpoint ticks until a prediction is committed.
 * evaluate reads theta; assisted practice also reads answer = theta in radius
 * lengths. Choices: pi/2, pi, 2*pi, 90. Kinds: shortArc, degrees, diameter, fullTurn.
 * Mode 1: fixed.radius = 1. Blue x = cos(theta), rose y = sin(theta), amber angle.
 * evaluate reads theta; assisted answer is the horizontal projection at the top.
 * Choices: 0, 1, -1. Kinds: unequal, swapped, sign. Hide both projection lengths
 * during placement; after commitment compare signed projections, not just sizes.
 * Mode 2: fixed.radius = fixed.wallX = 1. Extend the radius's supporting line to
 * the wall; for cos(theta) < 0 use a dashed backward extension, not a forward ray.
 * Plot wall height tan(theta), clipped at +/-4 with off-screen arrows. Exactly at
 * +/-pi/2 show parallel lines and no intersection: tangent is undefined there.
 * evaluate reads theta modulo pi (the same slope may occur on the opposite
 * radius); assisted answer is tan(theta). Choices: 1, sqrt(1/2), -1.
 * Kinds: height, sineOnly, sign. Keep the wall-height readout hidden before reveal.
 * Mode 3: fixed.radius = 1; explore x/y squares with their invariant total.
 * Prediction/review fix horizontalArea = 0.36, hide the vertical square, and ask
 * for the upper/lower signed length using answer choices. Do not constrain the
 * predicted leg to the circle before evaluation: its squared area may miss the
 * remaining space. Choices: 0.8, -0.8, 0.64, 0.4. Assisted practice instead locks
 * theta = pi/6 and asks for the vertical square area: 0.25, 0.5, 0.75, 1.
 * Guided/autonomous practice use the same missing-length task as prediction.
 * evaluate reads answer, plus theta when supplied as locked practice context.
 * Kinds: areaAsLength, linearRemainder, sign. Reveal signed legs and area gaps.
 *
 * circle-wave: a spinning wheel linked to a trace on a time axis, fixed.mode = 0
 * (vertical/sine shadow); an optional narrated comparison uses mode = 1 (cosine).
 * Bind amplitude -> y-axis drag_handle plus an in-plane peak/radius handle;
 * frequency -> slider for angular speed in radians per time unit, NOT an x rail.
 * fixed.phase = 0, fixed.timeSpan = 2*pi; y(t) = amplitude*sin(frequency*t).
 * Blue radius/peak height, amber speed/crest spacing, rose shadow/wave throughout.
 * evaluate reads amplitude and frequency for prediction, review and practice.
 * Hide the candidate trace until commitment; afterward compare height and crest
 * spacing with the ghost. Kinds: amplitude, frequency, swapped.
 */
export const trigChapter: LearningChapterInput = {
  id: "math-trig",
  trackId: "mathematics",
  position: 2,
  title: "Circles, waves & trigonometry",
  subtitle: "From spinning wheels to endless waves.",
  description:
    "Wrap a circle's edge, follow a spinning bead's shadows, and unroll its motion into waves. Discover how turns, slopes and triangles fit together.",
  status: "draft",
};

export const trigModules: LearningModuleInput[] = [
  {
    id: "math-trig-radians-01",
    trackId: "mathematics",
    chapterId: "math-trig",
    position: 30,
    title: "Measuring turns",
    interactive: "circle-trig",
    estimatedMinutes: 3,
    prerequisites: ["math-point-01"],
    status: "draft",
    spec: {
      targetSkill: "A radian wraps one radius length along a circle's edge; any turn measures arc length divided by radius.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 20 },
      stage1Anchoring: {
        visualMetaphor:
          "A straight glowing stick reaches from a wheel's centre to its edge, then bends into a ribbon and wraps around the rim.",
        caption: "Bend the stick. Wrap it around the wheel.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Centre-to-edge stick", colorToken: "blue" },
          { label: "Wrapped ribbon", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Move the bead. Count stick lengths along the rim.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "theta",
            label: "Turn",
            min: 0,
            max: 2 * Math.PI,
            step: Math.PI / 180,
            initial: Math.PI / 3,
            colorToken: "amber",
            visualSignaling: "The amber ribbon follows the rim bead at 60fps; each radius-length wrap pulses beside the blue stick.",
          },
        ],
        fixed: { mode: 0, radius: 1, reviewRadius: 2, reviewDistance: 6 },
        spatialContiguityRules: [
          "Pin the radius-length count along the ribbon, not in a separate legend.",
          "Attach the stick length to the blue centre-to-edge segment.",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Wrap the ribbon halfway around the circle.",
        userAction: "Place the rim bead before revealing the half-turn marker and measuring the wrapped ribbon.",
        target: { theta: Math.PI },
        tolerance: 0.02,
        adaptiveFeedback: {
          onCommonMisconception: "The amber gap shows how much ribbon misses the opposite edge.",
          onSuccess: "The halfway ribbon measures pi radius lengths.",
          byKind: {
            shortArc: "Three stick lengths leave a small gap before the opposite edge.",
            degrees: "That count uses degrees; count the blue stick lengths along the rim.",
            diameter: "The blue stick reaches the centre; the diameter crosses the whole wheel.",
            fullTurn: "That ribbon wraps the entire rim; the marked turn covers only part of it.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "θ = s / r",
        caption: "Radians count radius lengths along the rim. A half turn is π.",
        colorMapping: [
          { symbol: "θ", matchesVisual: "Amber turn wedge", colorToken: "amber" },
          { symbol: "s", matchesVisual: "Wrapped ribbon length", colorToken: "amber" },
          { symbol: "r", matchesVisual: "Centre-to-edge stick", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Compare quarter and full turns on different-sized circles; review uses radius 2 rolling a distance of 6.",
        spacedReviewPrompt: "Radius 2, rolled distance 6. Set the turn.",
        reviewTarget: { theta: 3 },
        reviewOnSuccess: "Six travelled lengths contain three of this wheel's radius lengths.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the ribbon wrap a full turn.", fade: "guided", target: { theta: 2 * Math.PI } },
          {
            prompt: "The quarter-turn is set. Predict its count of radius lengths.",
            fade: "assisted",
            target: { theta: Math.PI / 2, answer: Math.PI / 2 },
            presetControls: ["theta"],
          },
          { prompt: "Wrap one radius length along the rim.", fade: "autonomous", target: { theta: 1 } },
        ],
      },
    },
  },
  {
    id: "math-trig-sincos-01",
    trackId: "mathematics",
    chapterId: "math-trig",
    position: 31,
    title: "Shadows on the axes",
    interactive: "circle-trig",
    estimatedMinutes: 4,
    prerequisites: ["math-trig-radians-01"],
    status: "draft",
    spec: {
      targetSkill: "Cosine and sine are the signed horizontal and vertical shadows of a bead on a unit circle.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A bead travels around a hoop. Light casts its shadows onto the floor and wall; they stretch, shrink and cross the centre.",
        caption: "A moving bead casts changing shadows.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Bead", colorToken: "slate" },
          { label: "Floor shadow", colorToken: "blue" },
          { label: "Wall shadow", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Move the bead. Watch both shadows change direction and length.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "theta",
            label: "Turn",
            min: 0,
            max: 2 * Math.PI,
            step: Math.PI / 180,
            initial: Math.PI / 6,
            colorToken: "amber",
            visualSignaling: "Blue floor and rose wall shadows follow the rim bead at 60fps, highlighting direction changes across the centre.",
          },
        ],
        fixed: { mode: 1, radius: 1 },
        spatialContiguityRules: [
          "Keep each signed length beside its own shadow bar.",
          "Draw thin guides from the bead to both shadow endpoints.",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Place the bead where both shadows are equal and positive.",
        userAction: "Commit the bead's rim position with shadow readouts hidden, then reveal the signed shadow comparison.",
        target: { theta: Math.PI / 4 },
        tolerance: 0.02,
        adaptiveFeedback: {
          onCommonMisconception: "The overlaid bars show which shadow extends farther.",
          onSuccess: "Both positive shadows match at a quarter of a half-turn.",
          onSignError: "The bars match in size, but one points left or down.",
          byKind: {
            unequal: "The ghost bars share a start; their unmatched ends show the length gap.",
            swapped: "Blue measures across; rose measures up. Follow each beam to its own shadow.",
            sign: "Left and down have negative shadows; this target needs right and up.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "(x, y) = (cos θ, sin θ)",
        caption: "Cosine measures across; sine measures up. Their signs tell direction.",
        colorMapping: [
          { symbol: "cos θ", matchesVisual: "Floor shadow", colorToken: "blue" },
          { symbol: "sin θ", matchesVisual: "Wall shadow", colorToken: "rose" },
          { symbol: "θ", matchesVisual: "Turn from the right", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "After review, find the upper-left bead position where the floor shadow is -0.5.",
        spacedReviewPrompt: "Move above the centre until the floor shadow disappears.",
        reviewTarget: { theta: Math.PI / 2 },
        reviewOnSuccess: "At the top, the floor shadow vanishes while the wall shadow reaches full height.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch both shadows meet the positive diagonal.", fade: "guided", target: { theta: Math.PI / 4 } },
          {
            prompt: "The bead is at the top. Predict its floor shadow.",
            fade: "assisted",
            target: { theta: Math.PI / 2, answer: 0 },
            presetControls: ["theta"],
          },
          { prompt: "Make the floor shadow -0.5 with the bead above.", fade: "autonomous", target: { theta: 2 * Math.PI / 3 } },
        ],
      },
    },
  },
  {
    id: "math-trig-tangent-01",
    trackId: "mathematics",
    chapterId: "math-trig",
    position: 32,
    title: "The slope of a spin",
    interactive: "circle-trig",
    estimatedMinutes: 4,
    prerequisites: ["math-trig-sincos-01"],
    status: "draft",
    spec: {
      targetSkill: "Tangent is a radius line's slope and its signed intersection height on the wall one unit right of the centre.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A beam shines from a wheel's centre through a bead onto a nearby wall. As the bead climbs, the light spot races up the wall.",
        caption: "Turn the beam. Watch its spot climb the wall.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Wall", colorToken: "slate" },
          { label: "Wall height", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Turn the beam toward upright. Follow its wall spot.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "theta",
            label: "Beam turn",
            min: -Math.PI,
            max: Math.PI,
            step: Math.PI / 180,
            initial: Math.PI / 6,
            colorToken: "amber",
            visualSignaling: "The emerald wall segment updates at 60fps; off-screen arrows track large heights and a parallel cue replaces undefined strikes.",
          },
        ],
        fixed: { mode: 2, radius: 1, wallX: 1 },
        spatialContiguityRules: [
          "Attach the height readout to the emerald wall segment; show off-screen height beside its arrow.",
          "Keep blue across and rose up lengths on the bead's shadow triangle.",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Aim the beam to hit the wall at height 1.",
        userAction: "Set the rim bead with the strike hidden; commit before extending the beam to the wall.",
        target: { theta: Math.PI / 4 },
        tolerance: 0.02,
        adaptiveFeedback: {
          onCommonMisconception: "The emerald gap runs from your wall spot to the target tick.",
          onSuccess: "The wall triangle rises one unit for one unit across.",
          onSignError: "Your beam strikes below the floor; the target sits above it.",
          byKind: {
            height: "Compare the wall spot with the tick, not the bead's height.",
            sineOnly: "The bead's vertical shadow stops short; extend its line all the way to the wall.",
            sign: "The wall segment points downward; this target needs an upward strike.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "tan θ = sin θ / cos θ",
        caption: "Tangent compares rise with run. An upright line has no finite wall strike.",
        colorMapping: [
          { symbol: "tan θ", matchesVisual: "Wall strike height", colorToken: "emerald" },
          { symbol: "sin θ", matchesVisual: "Vertical shadow", colorToken: "rose" },
          { symbol: "cos θ", matchesVisual: "Horizontal shadow", colorToken: "blue" },
          { symbol: "θ", matchesVisual: "Beam turn", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Cross the upright position: no strike at pi/2, then the extended line meets the wall below.",
        spacedReviewPrompt: "Aim the beam to hit the wall at height -1.",
        reviewTarget: { theta: -Math.PI / 4 },
        reviewOnSuccess: "The wall triangle drops one unit for one unit across.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the beam meet the wall at floor level.", fade: "guided", target: { theta: 0 } },
          {
            prompt: "The beam turn is set. Predict the wall height.",
            fade: "assisted",
            target: { theta: Math.PI / 4, answer: 1 },
            presetControls: ["theta"],
          },
          { prompt: "Make the beam strike one unit below the floor.", fade: "autonomous", target: { theta: -Math.PI / 4 } },
        ],
      },
    },
  },
  {
    id: "math-trig-waves-01",
    trackId: "mathematics",
    chapterId: "math-trig",
    position: 33,
    title: "Unrolling the circle",
    interactive: "circle-wave",
    estimatedMinutes: 5,
    prerequisites: ["math-trig-tangent-01"],
    status: "draft",
    spec: {
      targetSkill: "A spinning bead's vertical shadow traces a sine wave; amplitude sets peak height and angular frequency sets cycle spacing.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 24 },
      stage1Anchoring: {
        visualMetaphor:
          "A wheel spins beside moving paper. A pen follows the bead's rising and falling shadow, leaving a smooth rolling trail.",
        caption: "A spinning wheel draws a rolling trail.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Wheel size", colorToken: "blue" },
          { label: "Spin speed", colorToken: "amber" },
          { label: "Pen trail", colorToken: "rose" },
        ],
      },
      stage2Exploration: {
        prompt: "Change wheel size and spin speed. Watch the trail respond.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "amplitude",
            label: "Peak height",
            min: 0.5,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "blue",
            visualSignaling: "The y-axis height handle resizes the blue radius and peak marker together at 60fps; the rose trail follows.",
          },
          {
            controlType: "slider",
            variableName: "frequency",
            label: "Spin speed",
            min: 0.5,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "Amber turn ticks speed up and crest-spacing guides contract at 60fps while the trace stays rose.",
          },
        ],
        fixed: { mode: 0, phase: 0, timeSpan: 2 * Math.PI },
        spatialContiguityRules: [
          "Connect the wheel shadow and pen with a horizontal dashed guide.",
          "Put peak height beside the peak marker and cycle spacing between neighbouring crests.",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Match the ghost wave's height and spacing.",
        userAction: "Set height and speed while the candidate trace is hidden; commit before releasing the pen over the ghost wave.",
        target: { amplitude: 2, frequency: 3 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Shaded gaps compare peak heights and distances between crests.",
          onSuccess: "The traces overlap: matching height and crest spacing.",
          byKind: {
            amplitude: "The crests line up in time, but their peak heights differ.",
            frequency: "The peaks reach the same height, but the crests arrive at different times.",
            swapped: "Height stretches the wave upward; spin speed packs crests closer together.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "y = A sin(ωt)",
        caption: "Amplitude sets height. Angular frequency sets how quickly cycles repeat.",
        colorMapping: [
          { symbol: "A", matchesVisual: "Wheel radius and peak height", colorToken: "blue" },
          { symbol: "ω", matchesVisual: "Spin speed and cycle-spacing guides", colorToken: "amber" },
          { symbol: "sin(ωt)", matchesVisual: "Vertical shadow and unrolled trace", colorToken: "rose" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Compare a horizontal-shadow cosine trace with the vertical-shadow sine trace: the same shape shifted a quarter-cycle.",
        spacedReviewPrompt: "Match the new ghost wave's height and spacing.",
        reviewTarget: { amplitude: 3, frequency: 1.5 },
        reviewOnSuccess: "Half the earlier spin speed doubles the spacing between crests.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch height and speed align with the ghost.", fade: "guided", target: { amplitude: 1.5, frequency: 2 } },
          {
            prompt: "Height is set. Match the ghost's crest spacing.",
            fade: "assisted",
            target: { amplitude: 2.5, frequency: 1 },
            presetControls: ["amplitude"],
          },
          { prompt: "Match both parts of the new ghost wave.", fade: "autonomous", target: { amplitude: 1, frequency: 2.5 } },
        ],
      },
    },
  },
  {
    id: "math-trig-identity-01",
    trackId: "mathematics",
    chapterId: "math-trig",
    position: 34,
    title: "Triangles inside circles",
    interactive: "circle-trig",
    estimatedMinutes: 4,
    prerequisites: ["math-trig-waves-01"],
    status: "draft",
    spec: {
      targetSkill: "The squared shadows of a unit-circle bead always add to one because its radius stays fixed.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A bead moves around a hoop. Squares built on its floor and wall shadows trade pieces, together always filling the same box.",
        caption: "The pieces change size. Together they fill the same box.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Floor square", colorToken: "blue" },
          { label: "Wall square", colorToken: "rose" },
          { label: "Whole box", colorToken: "slate" },
        ],
      },
      stage2Exploration: {
        prompt: "Move the bead. Watch the squares trade space.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "theta",
            label: "Turn",
            min: 0,
            max: 2 * Math.PI,
            step: Math.PI / 180,
            initial: Math.PI / 4,
            colorToken: "amber",
            visualSignaling: "Blue and rose squares resize at 60fps; transferred pieces fill the slate radius-square gauge without changing its total.",
          },
        ],
        fixed: { mode: 3, radius: 1, horizontalArea: 0.36 },
        spatialContiguityRules: [
          "Keep area values inside the squares and signed side lengths on their edges.",
          "Place the total-area value within the fixed radius-square gauge.",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Horizontal square area: 0.36. Predict the upper vertical shadow length.",
        userAction: "Choose a numeric length before revealing the hidden vertical square; compare its area with the unfilled gauge.",
        target: { answer: 0.8 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Your predicted side makes a square; the gauge shows its missing or excess area.",
          onSuccess: "The 0.8 side makes area 0.64; both squares fill the unit box.",
          onSignError: "That length points below the floor; the requested shadow points above it.",
          byKind: {
            areaAsLength: "The leftover area is not a side length; compare the square your chosen side builds.",
            linearRemainder: "Subtracting side lengths leaves an area gap; the box collects squares, not loose sides.",
            sign: "Squaring hides direction; the requested upper shadow needs a positive length.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "cos²θ + sin²θ = 1",
        caption: "The shadow squares add to the radius square, which stays fixed.",
        colorMapping: [
          { symbol: "cos²θ", matchesVisual: "Floor square area", colorToken: "blue" },
          { symbol: "sin²θ", matchesVisual: "Wall square area", colorToken: "rose" },
          { symbol: "1", matchesVisual: "Fixed radius-square gauge", colorToken: "slate" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Compare upper and lower shadows for the same horizontal area; then use horizontal length 0.8 to find vertical lengths +/-0.6.",
        spacedReviewPrompt: "Same horizontal square: predict the vertical length below the floor.",
        reviewTarget: { answer: -0.8 },
        reviewOnSuccess: "The lower shadow is -0.8; its square still fills area 0.64.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the missing upper length fill the area gap.", fade: "guided", target: { answer: 0.8 } },
          {
            prompt: "The turn is set. Predict the vertical square's area.",
            fade: "assisted",
            target: { theta: Math.PI / 6, answer: 0.25 },
            presetControls: ["theta"],
          },
          { prompt: "Horizontal square area: 0.36. Choose the upper vertical length.", fade: "autonomous", target: { answer: 0.8 } },
        ],
      },
    },
  },
];
