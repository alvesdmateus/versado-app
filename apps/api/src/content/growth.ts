import type { LearningChapterInput, LearningModuleInput } from "@versado/validation";

/**
 * Interactive contracts for draft boards (no client implementations yet).
 * Every board hides results during prediction until the learner commits; feedback
 * then overlays the discrepancy before revealing notation. Practice targets may
 * include exploration controls to configure the board as well as prediction inputs.
 * Assisted practice locks presetControls and leaves the prediction input free.
 *
 * growth-race: paired towers and a horizontal step track; explore/race/review modes.
 * Bind step_count_x -> horizontal rail + handle; growth_base_b -> multiplier slider.
 * Exploration: blue height = 1 + 3x, amber height = b^x, x = 0..6.
 * Race prediction resets b = 2, starts = 1, additive gain = 3; evaluate reads answer
 * (first integer step with amber strictly taller), not a tower height. Choices are
 * 3/4/5/6: 4 wins; 3 and 5 -> offByOne; 6 -> linearThinking. The latter continues
 * the last observed +4 gain at step 3: equality at 5, overtake at 6.
 * Review starts blue at 20 with +2, amber at 1 doubling; choices 4/5/6/13.
 * Answer 5 wins; 4/6 -> offByOne, 13 -> linearThinking (continue +4 from step 3).
 * Practice reads growth_base_b and answer; additive gain and starts stay unchanged.
 * For b = 3 choices 1/2/3; 2 wins, 1/3 -> offByOne.
 * Misconception kinds: linearThinking, offByOne.
 *
 * exponent-ribbon: ribbon length 2^exponent_x above a horizontal step track;
 * explore/place/length-choice modes. Bind exponent_x -> horizontal rail + handle
 * (-3..3, half-steps), with base 2 and starting length 1 fixed throughout.
 * Place/review evaluate exponent_x. Assisted practice locks exponent_x = -1 and
 * reads answer (length choice: -2/0/0.5/2); 0.5 wins. -2 -> negativeValue,
 * 2 -> forward, 0 -> additive (subtract one). Half-step exploration highlights geometric means;
 * a midpoint average -> additive. Misconception kinds: negativeValue, forward, additive.
 *
 * compound-growth: stacked gain bar and an initially hidden limiting-height line;
 * explore/height/practice/review modes. Bind split_count_n -> count slider (1..1000).
 * Each sub-step multiplies by 1 + 1/n: height = start * (1 + 1/n)^n.
 * Prediction binds height_y -> vertical rail + marker (1..6, step .001); evaluate
 * reads height_y, with n = 1,000,000, start = 1 and total nominal rate = 1 fixed.
 * Practice reads split_count_n plus height_y; assisted locks the count, not the marker.
 * Review uses start = 2 at the same nominal rate and n = 1,000,000.
 * Rounded marker targets use .005 absolute tolerance in every numeric mode.
 * Misconception kinds: unbounded (height >= 3 * start), singleJump (height near 2 * start).
 * The ceiling is specific to this fixed starting height, time interval and rate.
 *
 * doubling-machine: target-height bar linked to a horizontal step counter;
 * explore-height/predict-height/count-choice modes. Bind target_value_y -> vertical
 * rail + handle (1..32, step .25); start = 1, base = 2. Predict evaluate reads
 * target_value_y; freeze the counter until commitment. Assisted practice locks
 * target_value_y = 8 and reads answer (step choices 2/3/4/8); 3 wins.
 * Review fixes base = 10 and target height = 1000, reads answer (choices 2/3/4/100);
 * 3 wins. Choices 2/4 in either mode -> offByOne; 8 or 100 -> additive.
 * Misconception kinds: additive, offByOne. Review does not expose the height control.
 *
 * log-ruler: moving tick marks and colored ruler segments; explore/place/review modes.
 * Bind ruler_warp_factor -> warp slider (0 = linear, 1 = base-ten logarithmic).
 * Prediction binds marker_log -> horizontal rail + handle (0..3, step .001), with
 * warp = 1 locked; evaluate reads marker_log, a log coordinate, not a raw value.
 * Place 500 at log10(500), accepted within .01; midpoint specifically means placing
 * 500 halfway BETWEEN 100 AND 1000 (marker_log = 2.5, actually about 316).
 * linearSpacing means retaining the linear fraction (500-100)/(1000-100),
 * giving marker_log about 2.444; use a .02 neighborhood to classify either miss.
 * Review asks for the halfway location between 10 and 1000 (marker_log = 2).
 * Practice reads ruler_warp_factor and marker_log; warp stays 1 for placement.
 * Reveal blue log10(10) and amber log10(50) segments joining to emerald log10(500).
 * Misconception kinds: midpoint, linearSpacing.
 */
export const growthChapter: LearningChapterInput = {
  id: "math-growth",
  trackId: "mathematics",
  position: 3,
  title: "Growth, decay & logarithms",
  subtitle: "When the speed of growth depends on how big you already are.",
  description:
    "Race adding against multiplying, fold growth backward, split gains into smaller steps, then count those steps and build a ruler that fits giants.",
  status: "draft",
};

export const growthModules: LearningModuleInput[] = [
  {
    id: "math-growth-race-01",
    trackId: "mathematics",
    chapterId: "math-growth",
    position: 40,
    title: "Adding vs. multiplying",
    interactive: "growth-race",
    estimatedMinutes: 4,
    prerequisites: ["math-slope-intercept-01"],
    status: "draft",
    spec: {
      targetSkill: "Contrast equal additive gains with equal multiplicative factors, and predict when doubling overtakes adding.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 2, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "Matching towers grow in turns. The blue tower receives matching blocks; the amber tower copies its whole stack and piles the copy on top.",
        caption: "Matching blocks, or a copy of the whole stack?",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Matching blocks", colorToken: "blue" },
          { label: "Whole stack copies", colorToken: "amber" },
          { label: "Starting height", colorToken: "slate" },
        ],
      },
      stage2Exploration: {
        prompt: "Move through the steps. Change how much amber multiplies.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "step_count_x",
            label: "Step",
            min: 0,
            max: 6,
            step: 1,
            initial: 1,
            colorToken: "blue",
            visualSignaling: "At 60fps, the track handle selects a step and both tower tops update with their height tags.",
          },
          {
            controlType: "slider",
            variableName: "growth_base_b",
            label: "Multiply by",
            min: 1.5,
            max: 3,
            step: 0.5,
            initial: 2,
            colorToken: "amber",
            visualSignaling: "Amber copies resize immediately as the multiplier changes; the newly gained portion glows.",
          },
        ],
        fixed: { start_height: 1, linear_start: 1, linear_gain: 3 },
        spatialContiguityRules: [
          "Keep each height tag on its tower top and each gain bracket beside the gained blocks.",
          "Put the step count beneath the selected track tick and the multiplier on the amber copy bracket.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Both start 1: blue adds 3, amber doubles. First overtake?",
        userAction: "Choose a step number from 3, 4, 5 or 6 before the race runs; then compare tower heights at that step and the previous step.",
        target: { answer: 4 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The gap bracket compares both towers at your step and the previous step.",
          onSuccess: "At step 4, amber reaches 16 while blue reaches 13: its first overtake.",
          byKind: {
            linearThinking: "Keeping the last gain fixed misses the growing copies; amber passes blue sooner.",
            offByOne: "Compare adjacent steps: before the crossing amber trails; after it, amber has already passed.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "f(x) = a · bˣ",
        caption: "The starting height is multiplied again at every step.",
        colorMapping: [
          { symbol: "a", matchesVisual: "Starting height block", colorToken: "slate" },
          { symbol: "b", matchesVisual: "Amber whole-stack copy factor", colorToken: "amber" },
          { symbol: "ˣ", matchesVisual: "Selected step on the track", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Give blue a head start: 20 then +2 per step; amber starts at 1 and doubles. The first overtake is step 5.",
        spacedReviewPrompt: "Blue starts 20, adds 2; amber starts 1, doubles. First overtake?",
        reviewTarget: { answer: 5 },
        reviewOnSuccess: "At step 5, amber reaches 32 and passes blue's 30 for the first time.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the first overtake when amber doubles and blue adds 3.", fade: "guided", target: { growth_base_b: 2, answer: 4 } },
          {
            prompt: "Amber triples; blue adds 3. Both start 1. First overtake?",
            fade: "assisted",
            target: { growth_base_b: 3, answer: 2 },
            presetControls: ["growth_base_b"],
          },
          { prompt: "Choose doubling, then predict its first overtake of blue's +3.", fade: "autonomous", target: { growth_base_b: 2, answer: 4 } },
        ],
      },
    },
  },
  {
    id: "math-exponent-folding-01",
    trackId: "mathematics",
    chapterId: "math-growth",
    position: 41,
    title: "Folding and shrinking",
    interactive: "exponent-ribbon",
    estimatedMinutes: 4,
    prerequisites: ["math-growth-race-01"],
    status: "draft",
    spec: {
      targetSkill: "Read negative exponents as division steps and fractional exponents as partial multiplicative steps.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A ribbon stretches by copying itself as a bead moves right. Moving left folds the ribbon in half again and again, without sending it below the floor.",
        caption: "Move right to stretch. Move left to fold.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Forward copies", colorToken: "blue" },
          { label: "Backward folds", colorToken: "rose" },
          { label: "Between steps", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Move backward, forward, and between steps. Watch the ribbon.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "exponent_x",
            label: "Step position",
            min: -3,
            max: 3,
            step: 0.5,
            initial: 1,
            colorToken: "rose",
            visualSignaling: "At 60fps, the bead moves along the step track; folds glow rose and intermediate lengths glow amber.",
          },
        ],
        fixed: { growth_base_b: 2, start_height: 1 },
        spatialContiguityRules: [
          "Keep the fraction or decimal length inside the ribbon and the step count on the bead.",
          "Place ghost ribbons beside intermediate lengths to compare equal multiplication factors.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Start at 1. Place the step that leaves length 0.25.",
        userAction: "Move the bead or horizontal rail to a step; commit before the ribbon folds and its length appears.",
        target: { exponent_x: -2 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The ghost folds show the length your chosen step actually leaves.",
          onSuccess: "Two backward folds leave one quarter; the ribbon stays above the floor.",
          onSignError: "Your bead moved toward stretching; the target needs folds in the other direction.",
          byKind: {
            negativeValue: "Backward folds shorten the ribbon; its length never drops below the floor.",
            forward: "Forward copies enlarge the ribbon; reverse those moves to shrink it.",
            additive: "Equal partial steps multiply lengths equally; they do not add equal strips.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "b⁻ˣ = 1/bˣ,   √b = half a step",
        caption: "Backward steps divide. Half a step uses the factor that repeats twice.",
        colorMapping: [
          { symbol: "b⁻ˣ", matchesVisual: "Backward halving folds", colorToken: "rose" },
          { symbol: "√b", matchesVisual: "Intermediate ribbon between full steps", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "After the halving task, compare a half-step between lengths 1 and 9: the intermediate length is 3, not the additive midpoint 5.",
        spacedReviewPrompt: "Start at 1. Place the step that leaves one eighth.",
        reviewTarget: { exponent_x: -3 },
        reviewOnSuccess: "Three backward folds leave one eighth, still a positive length.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch the ribbon fold to one half.", fade: "guided", target: { exponent_x: -1 } },
          {
            prompt: "The backward step is set. Predict the ribbon's length.",
            fade: "assisted",
            target: { exponent_x: -1, answer: 0.5 },
            presetControls: ["exponent_x"],
          },
          { prompt: "Place the step that leaves length 0.125.", fade: "autonomous", target: { exponent_x: -3 } },
        ],
      },
    },
  },
  {
    id: "math-compound-growth-01",
    trackId: "mathematics",
    chapterId: "math-growth",
    position: 42,
    title: "The speed limit of growth",
    interactive: "compound-growth",
    estimatedMinutes: 5,
    prerequisites: ["math-exponent-folding-01"],
    status: "draft",
    spec: {
      targetSkill: "Discover e as the limiting multiplier when a fixed 100% growth rate is split into increasingly many compounding steps.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 24 },
      stage1Anchoring: {
        visualMetaphor:
          "A bar grows in a large jump, then in smaller jumps that build on each other. Finer jumps lift the top less and less toward a hidden shelf.",
        caption: "Smaller jumps lift the top closer to a hidden shelf.",
        durationSeconds: 9,
        pretrainingElements: [
          { label: "Small gains", colorToken: "blue" },
          { label: "Hidden shelf", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Split the same growth rate into more, smaller jumps.",
        controls: [
          {
            controlType: "slider",
            variableName: "split_count_n",
            label: "Growth splits",
            min: 1,
            max: 1000,
            step: 1,
            initial: 1,
            colorToken: "blue",
            visualSignaling: "At 60fps, gain slices narrow and the top rises by shrinking amounts; its height tag updates to three decimals.",
          },
        ],
        fixed: { start_height: 1, nominal_rate: 1, time_interval: 1 },
        spatialContiguityRules: [
          "Keep the three-decimal height on the bar top and the split count beside its gain slices.",
          "Reveal the limiting-height label on the shelf only after prediction.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Predict the bar's height after a million tiny growth steps.",
        userAction: "Place a height marker using its vertical rail, then run the million-step sweep with the same total nominal rate.",
        target: { height_y: 2.718 },
        tolerance: 0.005,
        adaptiveFeedback: {
          onCommonMisconception: "Zoom beside your marker: extra gains shrink as the bar approaches the shelf.",
          onSuccess: "The top settles near 2.718; the shelf now carries the name e.",
          byKind: {
            unbounded: "More slices add smaller bonuses; the top does not keep climbing past your marker.",
            singleJump: "Later slices grow from earlier gains; the top rises above the single-jump height.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "(1 + 1/n)ⁿ → e ≈ 2.718",
        caption: "With starting height and total rate fixed, finer compounding approaches this multiplier.",
        colorMapping: [
          { symbol: "e", matchesVisual: "Limiting height for this fixed growth setup", colorToken: "amber" },
          { symbol: "n", matchesVisual: "Count of blue gain slices", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Compare one 100% jump (height 2) with continuous compounding (near 2.718); then double the starting bar while keeping the rate fixed.",
        spacedReviewPrompt: "Mark continuous growth's height, starting at 2 with a 100% rate.",
        reviewTarget: { height_y: 5.436 },
        reviewOnSuccess: "Doubling the starting bar doubles the limiting height to about 5.436.",
        reviewIntervalsDays: [7, 14],
      },
      practice: {
        items: [
          { prompt: "Watch a single growth jump and its final height.", fade: "guided", target: { split_count_n: 1, height_y: 2 } },
          {
            prompt: "Ten splits are set. Mark the final height.",
            fade: "assisted",
            target: { split_count_n: 10, height_y: 2.594 },
            presetControls: ["split_count_n"],
          },
          { prompt: "Choose a thousand splits, then mark the final height.", fade: "autonomous", target: { split_count_n: 1000, height_y: 2.717 } },
        ],
      },
    },
  },
  {
    id: "math-logarithm-01",
    trackId: "mathematics",
    chapterId: "math-growth",
    position: 43,
    title: "Asking 'How many steps?'",
    interactive: "doubling-machine",
    estimatedMinutes: 4,
    prerequisites: ["math-compound-growth-01"],
    status: "draft",
    spec: {
      targetSkill: "Interpret a logarithm as the number of multiplicative steps needed to reach a chosen height.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A hand raises a bar while a bead travels along a path of growing copies. Raising the bar farther sends the bead through more copies.",
        caption: "Choose a height. Watch how many copies reach it.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Chosen height", colorToken: "amber" },
          { label: "Step counter", colorToken: "blue" },
          { label: "Copy machine", colorToken: "amber" },
        ],
      },
      stage2Exploration: {
        prompt: "Raise the target. Watch the counter follow each doubling.",
        controls: [
          {
            controlType: "drag_handle",
            variableName: "target_value_y",
            label: "Target height",
            min: 1,
            max: 32,
            step: 0.25,
            initial: 2,
            colorToken: "amber",
            visualSignaling: "At 60fps, the target bar follows its vertical handle; powers of two light whole ticks and other heights show partial steps.",
          },
        ],
        fixed: { growth_base_b: 2, start_height: 1 },
        spatialContiguityRules: [
          "Put the chosen value on the bar top and the live step count on the counter bead.",
          "Connect the bar and matching counter tick with a thin guide that follows the handle.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Set the height reached after four doubling steps from 1.",
        userAction: "Place the target-height handle; commit before the four doubling pulses and step counter are revealed.",
        target: { target_value_y: 16 },
        tolerance: 0,
        adaptiveFeedback: {
          onCommonMisconception: "The doubling trail ends above or below your chosen height; compare the gap.",
          onSuccess: "Four copies carry the height from 1 through 2, 4, 8, then 16.",
          byKind: {
            additive: "Equal additions miss the growing copies; compare each doubled bar along the trail.",
            offByOne: "The starting bar is step zero; count the jumps between bars.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "log₂ y = x  ⇔  2ˣ = y",
        caption: "An exponent gives the height; a logarithm asks how many steps reached it.",
        colorMapping: [
          { symbol: "log₂", matchesVisual: "Copy machine using factor b", colorToken: "amber" },
          { symbol: "y", matchesVisual: "Chosen target-height bar", colorToken: "amber" },
          { symbol: "x", matchesVisual: "Step count on the blue bead", colorToken: "blue" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Switch to tenfold copies and count steps from 1 to 1000. Contrast with zero: no finite doubling step can reach it.",
        spacedReviewPrompt: "Starting at 1, count tenfold steps to reach 1,000.",
        reviewTarget: { answer: 3 },
        reviewOnSuccess: "The trail reaches 10, 100, then 1,000: three tenfold steps.",
        reviewIntervalsDays: [1, 7],
      },
      practice: {
        items: [
          { prompt: "Watch two doubling steps raise the target from 1.", fade: "guided", target: { target_value_y: 4 } },
          {
            prompt: "Height 8 is set. How many doubling steps from 1?",
            fade: "assisted",
            target: { target_value_y: 8, answer: 3 },
            presetControls: ["target_value_y"],
          },
          { prompt: "Place the height reached after five doubling steps from 1.", fade: "autonomous", target: { target_value_y: 32 } },
        ],
      },
    },
  },
  {
    id: "math-log-scale-01",
    trackId: "mathematics",
    chapterId: "math-growth",
    position: 44,
    title: "Log scales",
    interactive: "log-ruler",
    estimatedMinutes: 4,
    prerequisites: ["math-logarithm-01"],
    status: "draft",
    spec: {
      targetSkill: "Read logarithmic ruler distances as multiplicative factors, making widely separated sizes comparable.",
      cognitiveLoadBudget: { maxSimultaneousVariables: 1, onScreenWordLimit: 22 },
      stage1Anchoring: {
        visualMetaphor:
          "A giant ruler squeezes small marks into a crowded clump. The ruler bends and stretches until repeated enlargements occupy matching spaces.",
        caption: "Stretch the crowded marks so small and giant can share space.",
        durationSeconds: 8,
        pretrainingElements: [
          { label: "Crowded ruler", colorToken: "slate" },
          { label: "Stretched ruler", colorToken: "slate" },
        ],
      },
      stage2Exploration: {
        prompt: "Warp the ruler. Follow the gaps between repeated tenfold jumps.",
        controls: [
          {
            controlType: "slider",
            variableName: "ruler_warp_factor",
            label: "Ruler warp",
            min: 0,
            max: 1,
            step: 0.01,
            initial: 0,
            colorToken: "slate",
            visualSignaling: "At 60fps, ticks shift from linear to logarithmic positions; equal tenfold gaps align and an exponential trace straightens.",
          },
        ],
        fixed: { log_base: 10, min_value: 1, max_value: 1000 },
        spatialContiguityRules: [
          "Keep 1, 10, 100 and 1000 attached to their moving ticks.",
          "Attach factor labels to ruler segments; reveal the marker's value only after commitment.",
        ],
      },
      stage3Prediction: {
        icapTarget: "constructive",
        challengePrompt: "Place 500 on the logarithmic ruler.",
        userAction: "With the ruler fully warped, drag the marker or its horizontal rail between 100 and 1000; commit before revealing the value.",
        target: { marker_log: 2.699 },
        tolerance: 0.01,
        adaptiveFeedback: {
          onCommonMisconception: "Compare the multiplicative gaps on either side of your marker.",
          onSuccess: "500 lies beyond halfway; the joined ruler segments show its multiplicative distance.",
          byKind: {
            midpoint: "Halfway between 100 and 1,000 marks about 316; 500 belongs farther right.",
            linearSpacing: "Your marker keeps the old ruler's fraction; compare the equal tenfold gaps instead.",
          },
        },
      },
      stage4Formalization: {
        formalExpression: "log(A·B) = log A + log B",
        caption: "Multiplying sizes joins their distances along this ruler.",
        colorMapping: [
          { symbol: "log(A·B)", matchesVisual: "Combined ruler distance to 500", colorToken: "emerald" },
          { symbol: "log A", matchesVisual: "First segment for factor 10", colorToken: "blue" },
          { symbol: "log B", matchesVisual: "Second segment for factor 50", colorToken: "amber" },
        ],
      },
      retentionHooks: {
        interleavedVariation: "Compare signal amplitudes separated by two base-ten ruler steps: the amplitude ratio is 100, while the drawn gap is only two steps.",
        spacedReviewPrompt: "Place the number halfway between 10 and 1,000.",
        reviewTarget: { marker_log: 2 },
        reviewOnSuccess: "100 sits halfway: each side spans the same tenfold change.",
        reviewIntervalsDays: [7, 14],
      },
      practice: {
        items: [
          { prompt: "Watch 10 land on the fully warped ruler.", fade: "guided", target: { ruler_warp_factor: 1, marker_log: 1 } },
          {
            prompt: "The ruler is warped. Place 20.",
            fade: "assisted",
            target: { ruler_warp_factor: 1, marker_log: 1.301 },
            presetControls: ["ruler_warp_factor"],
          },
          { prompt: "Warp the ruler, then place 500.", fade: "autonomous", target: { ruler_warp_factor: 1, marker_log: 2.699 } },
        ],
      },
    },
  },
];
