import type { LearningChapterInput, LearningModuleInput } from "@versado/validation";

/**
 * Interactive contracts (draft boards; neither slug has a client implementation yet).
 * All prediction/review/practice answers commit before verification reveals the result.
 * Freeze exploration inputs during choices; never expose more than two active variables.
 * Numeric evaluation uses unrounded geometry, not the displayed readout.
 *
 * calculus-slope: linked curve and slope panels with a shared horizontal coordinate.
 * Modes come from fixed.mode: 1 = shrinking bridge, 2 = zoom lens, 3 = surfer.
 * Mode 1: f(x)=x^2, anchor x=1; review uses anchor x=-1 on the same curve.
 * Reserve x in [-2,4] and y in [-1,17] so even the widest bridge fits.
 * Bind step_gap_h -> slider; the second pin follows anchor+h, not a separate control.
 * Prediction binds answer -> slope choice (2, 5, 0, -2); review choices (-2, 1, 0, 2).
 * Hide the limiting slope until commit; shrinking stops at h=.01, never divides by zero.
 * Then animate the limiting rail. evaluate reads answer; practice also reads step_gap_h.
 * Practice stays at anchor x=1: guided/assisted use h=.01; autonomous compares h=1
 * with the limiting rail. Lock h before choosing; the assisted item presets it.
 * Misconception kinds: secant (finite-gap slope), zero (zero gap means zero slope), sign.
 * The bridge is slate, limiting rail emerald, gap amber, rise rose, anchor blue.
 *
 * Mode 2: f(x)=x^2; zoom preserves aspect ratio, centred on the probe.
 * Bind zoom_magnification -> slider; probe_x -> x-axis rail + in-plane curve handle.
 * The probe's slope is a computed emerald dot; no independent slope-height control.
 * Adaptation: replace the spec's three independent markers with one shape choice.
 * Freeze probe/zoom and hide the completed slope trace until the choice commits.
 * Bind answer -> graph choice: 1 rising line through origin; 2 copied U-shaped curve
 * (height); 3 nonnegative V (sign); 4 falling line (reversed).
 * Review uses f(x)=3x+1: choices 5 horizontal at 3, 6 copied original line (height),
 * 7 horizontal at 1 (intercept), 8 horizontal at 0 (flat).
 * evaluate reads answer; practice additionally reads zoom_magnification, held at 50
 * before choice. Main/practice use the parabola; only review uses the straight line.
 * Misconception kinds: height, sign, reversed, intercept, flat.
 * Original curve stays blue; slope trace stays emerald across every stage.
 *
 * Mode 3: f(x)=x^3-3x, f'(x)=3x^2-3, domain [-2,2].
 * Bind surfer_x -> x-axis rail + in-plane surfer handle; prediction hides the top
 * curve but keeps the derivative visible. Main locates the peak x=-1; review the
 * valley x=1. Adaptation: collect pins sequentially, not as simultaneous variables.
 * evaluate reads surfer_x; practice also reads answer -> direction choice
 * (-1 falling afterward, 1 rising afterward, 0 staying flat).
 * Practice places the surfer first, locks it, then asks for direction; assisted
 * presets surfer_x. Only one variable is active at a time.
 * Interleaved shelf demonstration uses f(x)=x^3 at x=0: zero slope, no sign change.
 * Misconception kinds: height (curve-axis crossing), swapped (valley versus peak),
 * shelf (zero slope without a turn). Curve blue, surfer/pins amber, level glow emerald.
 *
 * calculus-area: shaded strips under a curve with an x-axis boundary handle;
 * a linked lower panel shows accumulated area when fixed.mode=2.
 * Mode 1: f(x)=2x, left wall a=0; exact signed area A(b)=b^2 on b in [0,3].
 * Bind slice_count_n -> integer slider; right_bound_b -> x-axis rail + wall handle.
 * Use left-endpoint rectangles, width b/n; finite error slivers remain visible.
 * Main goal area 4 => b=2; review area 1 => b=1. evaluate reads right_bound_b;
 * practice also reads slice_count_n. Prediction locks n=200 and hides the total
 * until commit, then shows the sum approaching the exact area (not equality at n=200).
 * Guided/assisted practice sets n=200; autonomous chooses n=200 and b=3 for area 9.
 * Interleaved signed-area demonstration extends f(x)=2x below the axis on [-1,1],
 * with left wall -1: negative and positive lobes cancel; no extra learner control.
 * Misconception kinds: height (matching bar height), coarse (finite sum as exact),
 * unsigned (counting below-axis slices positively).
 * Strips/height blue, boundary/width amber, curve slate; success outlines emerald.
 *
 * Mode 2: f(x)=4x-x^2 on [0,4], a=0; A(x)=2x^2-x^3/3.
 * Bind sweep_x -> x-axis rail + leading-edge handle. Main maximum growth is x=2;
 * review stops growing at x=4 (exclude the starting wall x=0 in its prompt).
 * Hide the growth comparison during prediction; verify with equal-width nudges.
 * evaluate reads sweep_x; practice also reads answer -> rate choice.
 * At x=2 choices: 4, 16/3 (total), 2 (position), 0 (curve_flat).
 * At x=1 choices: 3, 5/3 (total), 1 (position), 2 (curve_flat).
 * Practice locks position before choosing; assisted presets sweep_x. One active
 * variable at a time. Area region stays blue, edge height amber, area slope emerald.
 * Misconception kinds: total (largest accumulated area), position (x as rate),
 * curve_flat (slope of the original curve instead of slope of accumulated area).
 */
export const calculusChapter: LearningChapterInput = {
  id: "math-calculus",
  trackId: "mathematics",
  position: 4,
  title: "Calculus: the geometry of change",
  subtitle: "Zooming in until curves become lines, and slicing shapes into infinitely thin strips.",
  description:
    "Shrink a bridge into a tangent, zoom into a curve, and find its turning points. Add thin slices into area, then connect the area's growth to the height at its moving edge.",
  status: "draft",
};

export const calculusModules: LearningModuleInput[] = [
  {
    id: "math-secant-01",
    trackId: "mathematics",
    chapterId: "math-calculus",
    position: 50,
    title: "Average vs. instant speed",
    interactive: "calculus-slope",
    estimatedMinutes: 4,
    prerequisites: ["math-quad-shape-01", "math-slope-intercept-01"],
    status: "draft",
    spec: {
      targetSkill: "Shrink a two-point average slope toward the single-point slope without dividing by a zero gap.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A bridge joins glowing pins on a hill. As the moving pin approaches the resting pin, the bridge settles along the hillside.",
        caption: "Bring the pins together. Watch the bridge settle.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Resting pin", colorToken: "blue" },
          { label: "Moving pin", colorToken: "amber" },
          { label: "Bridge", colorToken: "slate" },
        ],
      },
      stage2Exploration: {
        prompt: "Shrink the gap. Watch rise and run shrink together.",
        fixed: { mode: 1, anchor_x: 1 },
        controls: [
          {
            controlType: "slider",
            variableName: "step_gap_h",
            label: "Pin gap",
            min: 0.01,
            max: 3,
            step: 0.01,
            initial: 3,
            colorToken: "amber",
            visualSignaling: "At 60fps, the amber gap and rose rise shrink; the bridge's attached steepness readout approaches a stable value.",
          },
        ],
        spatialContiguityRules: [
          "Keep the rise readout on the rose vertical edge and the gap on the amber horizontal edge.",
          "Attach the steepness ratio to the bridge, not a separate legend.",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Which steepness will the bridge approach as the pins meet?",
        userAction: "Choose a steepness with the gap locked, then run the shrinking bridge to reveal its limiting rail.",
        target: { answer: 2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Your predicted rail and the settling bridge leave an angle between them.",
          onSuccess: "The rail settles at steepness 2 even as rise and run shrink.",
          onSignError: "Your rail falls, but this hillside rises toward the right.",
          byKind: {
            secant: "That steepness belongs to the wider bridge; the bridge keeps turning as the gap shrinks.",
            zero: "Both lengths shrink together; their ratio need not shrink to zero.",
            sign: "The bridge rises toward the right; compare your rail's direction.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "f′(x) = lim h→0 (f(x+h) − f(x)) / h",
        caption: "The derivative is the limiting slope, not a fraction evaluated at zero.",
        colorMapping: [
          { symbol: "f′(x)", matchesVisual: "Steepness of the limiting rail", colorToken: "emerald" },
          { symbol: "f(x+h) − f(x)", matchesVisual: "Vertical rise between the pins", colorToken: "rose" },
          { symbol: "h", matchesVisual: "Horizontal gap between the pins", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Move the resting pin to x=-1 on the same bowl. Predict a falling rail; explain why a zero gap cannot be substituted into the ratio.",
        spacedReviewPrompt: "On the descending hillside, which steepness will the bridge approach?",
        reviewTarget: { answer: -2 },
        reviewOnSuccess: "The rail settles at steepness −2: shrinking the gap preserves the downhill direction.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the tiny-gap bridge approach its final steepness.", fade: "guided", target: { step_gap_h: 0.01, answer: 2 } },
          {
            prompt: "The tiny gap is set. Choose the limiting steepness.",
            fade: "assisted",
            target: { step_gap_h: 0.01, answer: 2 },
            presetControls: ["step_gap_h"],
          },
          { prompt: "Start with gap 1. Predict the final, not current, steepness.", fade: "autonomous", target: { step_gap_h: 1, answer: 2 } },
        ],
      },
    },
  },
  {
    id: "math-derivative-01",
    trackId: "mathematics",
    chapterId: "math-calculus",
    position: 51,
    title: "Zooming in",
    interactive: "calculus-slope",
    estimatedMinutes: 4,
    prerequisites: ["math-secant-01"],
    status: "draft",
    spec: {
      targetSkill: "A smooth curve looks straight up close; tracing its local slopes produces a new graph.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A lens moves closer to a bent trail until the bend looks straight. A glowing dot below follows how steep the trail looks.",
        caption: "Look closer. The bend starts to look straight.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Bent trail", colorToken: "blue" },
          { label: "Steepness trail", colorToken: "emerald" },
        ],
      },
      stage2Exploration: {
        prompt: "Zoom closer, then move along the curve. Compare the trails.",
        fixed: { mode: 2 },
        controls: [
          {
            controlType: "slider",
            variableName: "zoom_magnification",
            label: "Zoom",
            min: 1,
            max: 50,
            step: 1,
            initial: 1,
            colorToken: "slate",
            visualSignaling: "At 60fps, the lens magnifies equally across and upward; the local blue bend approaches a straight segment.",
          },
          {
            controlType: "drag_handle",
            variableName: "probe_x",
            label: "Probe position",
            min: -2,
            max: 2,
            step: 0.1,
            initial: 1,
            colorToken: "blue",
            visualSignaling: "At 60fps, the curve probe and computed emerald slope dot travel together on a vertical guide.",
          },
        ],
        spatialContiguityRules: [
          "Link the top probe and bottom slope dot with a shared vertical guide.",
          "Keep the slope readout beside its bottom dot and zoom readout on the lens rim.",
        ],
      },
      stage3Prediction: {
        icapTarget: "interactive",
        challengePrompt: "Which lower trail will appear when the probe sweeps across?",
        userAction: "Choose one slope-graph shape with probe and zoom locked; commit before the full sweep reveals it.",
        target: { answer: 1 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "Compare your trail's height with the hill's steepness at the highlighted point.",
          onSuccess: "The slope trail rises straight through the centre: downhill, level, then uphill.",
          onSignError: "Downhill sections place the slope trail below the axis.",
          byKind: {
            height: "You copied the hill's height; the lower dot records steepness instead.",
            sign: "The downhill half needs negative steepness, below the axis.",
            reversed: "The hill's steepness increases as the probe moves right; your trail decreases.",
            intercept: "The line's starting height differs from how much it rises each step.",
            flat: "A straight line keeps its steepness; it need not have zero steepness.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "d/dx (x²) = 2x",
        caption: "The derivative graph records the original curve's slope at each position.",
        colorMapping: [
          { symbol: "x²", matchesVisual: "Original bowl-shaped curve", colorToken: "blue" },
          { symbol: "2x", matchesVisual: "Straight traced slope graph", colorToken: "emerald" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Replace the bowl with f(x)=3x+1. Choose its slope graph from horizontal and sloping candidates.",
        spacedReviewPrompt: "This straight line rises 3 per step. Choose its slope graph.",
        reviewTarget: { answer: 5 },
        reviewOnSuccess: "The lower trail stays at 3; the upper line has the same slope everywhere.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the close view and its slope trail connect.", fade: "guided", target: { zoom_magnification: 50, answer: 1 } },
          {
            prompt: "The lens is set. Choose the bowl's slope trail.",
            fade: "assisted",
            target: { zoom_magnification: 50, answer: 1 },
            presetControls: ["zoom_magnification"],
          },
          { prompt: "Zoom fully, then predict the slope trail before sweeping.", fade: "autonomous", target: { zoom_magnification: 50, answer: 1 } },
        ],
      },
    },
  },
  {
    id: "math-extrema-01",
    trackId: "mathematics",
    chapterId: "math-calculus",
    position: 52,
    title: "Peaks, valleys, and flat spots",
    interactive: "calculus-slope",
    estimatedMinutes: 4,
    prerequisites: ["math-derivative-01"],
    status: "draft",
    spec: {
      targetSkill: "Find smooth peaks and valleys using zero slope and a change of slope sign; a flat spot alone need not turn.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A surfer rides over a rolling hill and into a hollow. The board lies level at the crest and the bottom before tipping again.",
        caption: "The board levels out, then tips the other way.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Rolling hill", colorToken: "blue" },
          { label: "Surfboard", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Move the surfer. Watch the board level out and tip.",
        fixed: { mode: 3 },
        controls: [
          {
            controlType: "drag_handle",
            variableName: "surfer_x",
            label: "Surfer position",
            min: -2,
            max: 2,
            step: 0.1,
            initial: -1.5,
            colorToken: "amber",
            visualSignaling: "At 60fps, the surfboard follows local steepness; an emerald level glow appears at zero, with an optional chime.",
          },
        ],
        spatialContiguityRules: [
          "Pin the slope sign directly above the board and its zero-level bubble inside it.",
          "Align the bottom slope dot vertically with the surfer.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Use the slope trail to place a hidden hilltop pin.",
        userAction: "Move the surfer's horizontal rail using only the lower slope graph; commit before revealing the hidden upper curve.",
        target: { surfer_x: -1 },
        tolerance: 0.05,
        adaptiveFeedback: {
          onCommonMisconception: "The local reveal shows which way the trail leans beside your pin.",
          onSuccess: "At this pin, the trail rises before levelling and falls afterward.",
          byKind: {
            height: "Crossing the floor measures height, not whether the board is level.",
            swapped: "Your pin marks a valley: falling before, rising afterward.",
            shelf: "The board levels briefly, but the trail continues in the same direction.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "f′(x) = 0 → peak or valley",
        caption: "A smooth turning point has zero slope; check both sides to identify the turn.",
        colorMapping: [
          { symbol: "f′(x) = 0", matchesVisual: "Level glow on the horizontal board", colorToken: "emerald" },
          { symbol: "peak", matchesVisual: "Hilltop pin with rising then falling trail", colorToken: "amber" },
          { symbol: "valley", matchesVisual: "Hollow pin with falling then rising trail", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Contrast the cubic hill's peak with the flat shelf of f(x)=x^3 at x=0: both level out, but only the peak changes slope sign.",
        spacedReviewPrompt: "Use the slope trail to place the hidden valley pin.",
        reviewTarget: { surfer_x: 1 },
        reviewOnSuccess: "The valley's board is level, with falling trail before and rising trail afterward.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the hilltop pin, then the trail falling afterward.", fade: "guided", target: { surfer_x: -1, answer: -1 } },
          {
            prompt: "The hilltop pin is set. Which way afterward?",
            fade: "assisted",
            target: { surfer_x: -1, answer: -1 },
            presetControls: ["surfer_x"],
          },
          { prompt: "Place the valley pin, then predict the direction afterward.", fade: "autonomous", target: { surfer_x: 1, answer: 1 } },
        ],
      },
    },
  },
  {
    id: "math-integral-01",
    trackId: "mathematics",
    chapterId: "math-calculus",
    position: 53,
    title: "Adding up thin slices",
    interactive: "calculus-area",
    estimatedMinutes: 5,
    prerequisites: ["math-extrema-01"],
    status: "draft",
    spec: {
      targetSkill: "Sum thinner rectangles toward exact area under a curve, treating slices below the axis as negative contributions.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "Chunky blocks fill the space beneath a sloping roof. The blocks split into slimmer strips until their jagged tops nearly hug the roof.",
        caption: "Slimmer strips hug the roof more closely.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Area strips", colorToken: "blue" },
          { label: "Roof", colorToken: "slate" },
        ],
      },
      stage2Exploration: {
        prompt: "Add strips or move the wall. Watch the missing slivers.",
        fixed: { mode: 1, left_bound_a: 0 },
        controls: [
          {
            controlType: "slider",
            variableName: "slice_count_n",
            label: "Slice count",
            min: 4,
            max: 200,
            step: 1,
            initial: 4,
            colorToken: "blue",
            visualSignaling: "At 60fps, blue rectangles split into thinner strips; their remaining error slivers shrink as the count increases.",
          },
          {
            controlType: "drag_handle",
            variableName: "right_bound_b",
            label: "Right wall",
            min: 0,
            max: 3,
            step: 0.1,
            initial: 1,
            colorToken: "amber",
            visualSignaling: "At 60fps, the amber boundary slides horizontally, resizing the blue strips and updating their summed area.",
          },
        ],
        spatialContiguityRules: [
          "Put the summed area inside the shaded region and the boundary value at the wall's foot.",
          "Attach each strip's height to its side and width to its amber base on selection.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Where should the wall stand to enclose area 4?",
        userAction: "With slice count locked at 200 and the total hidden, place the wall; commit before revealing the exact area and remaining slivers.",
        target: { right_bound_b: 2 },
        tolerance: 0.02,
        adaptiveFeedback: {
          onCommonMisconception: "The highlighted strip shows area missing from, or extending beyond, the target region.",
          onSuccess: "The exact region has area 4; the finite strip sum still leaves tiny slivers.",
          byKind: {
            height: "That wall matches a height; the target counts the whole shaded region.",
            coarse: "The rectangles still leave slivers; their finite sum is an approximation.",
            unsigned: "Below the axis, slices subtract from the total rather than adding.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "∫ₐᵇ f(x) dx ≈ Σ f(x) Δx",
        caption: "The integral is the limiting signed sum of slice height times width.",
        colorMapping: [
          { symbol: "∫ₐᵇ", matchesVisual: "Accumulation between the boundary walls", colorToken: "amber" },
          { symbol: "f(x)", matchesVisual: "Height of a selected blue strip", colorToken: "blue" },
          { symbol: "Δx", matchesVisual: "Amber base width of a finite strip", colorToken: "amber" },
          { symbol: "dx", matchesVisual: "Slice width in the limiting picture", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Extend the line below the axis and sum from -1 to 1. Compare the negative left lobe and positive right lobe, whose signed areas cancel.",
        spacedReviewPrompt: "Where should the wall stand to enclose area 1?",
        reviewTarget: { right_bound_b: 1 },
        reviewOnSuccess: "This triangular region has area 1; each slice contributes height times width.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch 200 strips approach a region of area 1.", fade: "guided", target: { slice_count_n: 200, right_bound_b: 1 } },
          {
            prompt: "The strips are set. Move the wall for area 4.",
            fade: "assisted",
            target: { slice_count_n: 200, right_bound_b: 2 },
            presetControls: ["slice_count_n"],
          },
          { prompt: "Use 200 strips. Place the wall for exact area 9.", fade: "autonomous", target: { slice_count_n: 200, right_bound_b: 3 } },
        ],
      },
    },
  },
  {
    id: "math-ftc-01",
    trackId: "mathematics",
    chapterId: "math-calculus",
    position: 54,
    title: "Two sides of the same coin",
    interactive: "calculus-area",
    estimatedMinutes: 4,
    prerequisites: ["math-integral-01"],
    status: "draft",
    spec: {
      targetSkill: "The rate at which accumulated area grows equals the curve's height at the moving edge.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 24 },
      stage1Anchoring: {
        visualMetaphor:
          "A wall sweeps beneath a hill, gathering a glowing ribbon behind it. Equal little nudges gather bigger patches where the wall is taller.",
        caption: "The wall gathers more with each nudge where it stands taller.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Gathered ribbon", colorToken: "blue" },
          { label: "Leading edge", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Sweep the edge. Compare its height with the area's steepness.",
        fixed: { mode: 2, left_bound_a: 0 },
        controls: [
          {
            controlType: "drag_handle",
            variableName: "sweep_x",
            label: "Sweep edge",
            min: 0,
            max: 4,
            step: 0.1,
            initial: 0.5,
            colorToken: "amber",
            visualSignaling: "At 60fps, the amber edge adds a blue sliver; its height matches the emerald slope readout on the accumulated-area graph.",
          },
        ],
        spatialContiguityRules: [
          "Align the top height bar with the bottom area's slope readout on the same vertical guide.",
          "Keep the accumulated total inside the shaded region and each nudge beside the moving edge.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Where will the gathered area grow fastest as the wall moves?",
        userAction: "Place the leading edge before revealing the rate comparison; commit, then compare equal-width nudges at your marker and the fastest point.",
        target: { sweep_x: 2 },
        tolerance: 0.05,
        adaptiveFeedback: {
          onCommonMisconception: "Equal nudges add different strips; compare their heights at your marker and the highlighted location.",
          onSuccess: "At the tallest edge, each tiny nudge adds area fastest.",
          byKind: {
            total: "More area behind the wall does not mean the next strip adds area faster.",
            position: "The edge's horizontal position differs from the new strip's height.",
            curve_flat: "The top curve's tilt differs from the accumulated area's slope; compare the edge height.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "d/dx ∫ₐˣ f(t) dt = f(x)",
        caption: "For a continuous curve, differentiating accumulated area returns the height at the moving edge.",
        colorMapping: [
          { symbol: "d/dx", matchesVisual: "Slope readout on the accumulated-area graph", colorToken: "emerald" },
          { symbol: "∫ₐˣ f(t) dt", matchesVisual: "Blue area accumulated behind the edge", colorToken: "blue" },
          { symbol: "f(x)", matchesVisual: "Amber height at the leading edge", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Find the far endpoint where height reaches zero and accumulated area stops growing momentarily. For nonnegative speed, accumulated area represents distance travelled.",
        spacedReviewPrompt: "Beyond the starting wall, where does the area stop growing momentarily?",
        reviewTarget: { sweep_x: 4 },
        reviewOnSuccess: "At the far endpoint the edge has zero height, so the area's slope is zero.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the tallest edge match the area's growth rate.", fade: "guided", target: { sweep_x: 2, answer: 4 } },
          {
            prompt: "The edge is set. Predict the area's growth rate.",
            fade: "assisted",
            target: { sweep_x: 2, answer: 4 },
            presetControls: ["sweep_x"],
          },
          { prompt: "Place the edge at 1, then predict the area's growth rate.", fade: "autonomous", target: { sweep_x: 1, answer: 3 } },
        ],
      },
    },
  },
];
