# Mathematics Curriculum Specification (Chapters 2–5)
**Architecture Reference:** `intuitive_interactive_learning.md`  
**Pedagogical Sequence:** See it $\rightarrow$ Move it $\rightarrow$ Predict it $\rightarrow$ Write it

---

## Curriculum Overview

| Chapter | Title | Tagline | Modules | Status |
| :--- | :--- | :--- | :---: | :--- |
| **Chapter 1** | Algebra | *Algebra through geometry: see it, move it, predict it — then write it.* | 11 | Implemented |
| **Chapter 2** | Vectors, Matrices & Space | *Points are places, vectors are moves, matrices reshape, stretch, and undo the whole plane.* | 10 (5 + 5) | 5 Done / 5 New |
| **Chapter 3** | Circles, Waves & Trigonometry | *From spinning wheels to endless waves.* | 5 | New |
| **Chapter 4** | Growth, Decay & Logarithms | *When the speed of growth depends on how big you already are.* | 5 | New |
| **Chapter 5** | Calculus: The Geometry of Change | *Zooming in until curves become lines, and slicing shapes into infinitely thin strips.* | 5 | New |

---

## Chapter 2 · Vectors, Matrices & Space
**Tagline:** *Points are places, vectors are moves, matrices reshape, stretch, and undo the whole plane.*  
*(Modules 2.1–2.5 represent the existing completed foundation; Modules 2.6–2.10 extend linear transformations into determinants, inverses, systems, and eigenvectors).*

### Existing Foundation (Completed)
* **2.1** A point is an address
* **2.2** A vector is a move
* **2.3** Moves add up
* **2.4** A matrix reshapes the plane
* **2.5** Points are recipes

---

### Module 2.6 · Stretching Space (The Determinant)
```yaml
module_id: "math_linalg_determinant_06"
title: "Stretching space"
target_skill: "Understand the determinant as the area scaling factor and orientation flip of a linear transformation."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "A glowing 1x1 unit square tile on a grid morphs smoothly into a tilted parallelogram as basis arrows move, changing color intensity as its area grows or shrinks."
  duration_seconds: 8
  pretraining_elements:
    - "Unit Tile (translucent Cyan square, area = 1)"
    - "Transformed Parallelogram (Amber/Coral dynamic polygon)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "basis_vector_i"
      visual_signaling: "Real-time area polygon updates at 60fps; flips from Amber to Magenta when vectors cross orientation."
    - control_type: "drag_handle"
      variable_name: "basis_vector_j"
      visual_signaling: "Live area multiplier number anchored directly at the center of the parallelogram."
  spatial_contiguity_rules:
    - "Anchor area readout inside the parallelogram centroid."
    - "Attach coordinate pairs directly to arrow tips."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Stretch the basis arrows to triple the tile's area."
  user_action: "Drag the two basis handles until predicted area equals 3.0, then release to test."
  adaptive_feedback:
    on_common_misconception: "Overlay a ghost outline of the target 3x area grid so the user sees the excess or missing area slice."
    on_success: "Pulse parallelogram border in Emerald and transition to symbolic readout."

stage_4_formalization:
  formal_expression: "\\det(A) = ad - bc"
  color_mapping:
    - symbol: "\\det(A)"
      matches_visual: "Center area multiplier readout (Amber/Magenta)"
    - symbol: "ad"
      matches_visual: "Primary outer rectangle area (Cyan)"
    - symbol: "- bc"
      matches_visual: "Subtracted corner overlap area (Coral)"

retention_hooks:
  interleaved_variation: "Create a negative area of -2 by flipping the arrows past each other."
  spaced_review_prompt: "Predict whether a given 2x2 arrow pair expands, shrinks, or flips the grid (+24h)."
```

---

### Module 2.7 · Collapsing Into a Line
```yaml
module_id: "math_linalg_singular_07"
title: "Collapsing into a line"
target_skill: "Recognize that a zero determinant flattens 2D space onto a 1D line, permanently losing dimensional information."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 20

stage_1_anchoring:
  visual_metaphor: "Multiple distinct colored dots scattered across a 2D plane get crushed together onto a single straight laser line as the grid folds flat."
  duration_seconds: 9
  pretraining_elements:
    - "Scattered Cloud Points (multi-colored dots)"
    - "Collapsed Line (bright White 1D rail)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "second_column_vector"
      visual_signaling: "As the second vector approaches alignment with the first, the parallelogram narrows into a glowing line and area reads 0.0."
  spatial_contiguity_rules:
    - "Display angle/alignment glow between the two basis arrows."
    - "Keep 'Area = 0' pinned directly onto the flattened segment."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Align the second arrow to crush the entire grid into one line."
  user_action: "Drag the second basis vector onto the span line of the first vector before running the grid crush animation."
  adaptive_feedback:
    on_common_misconception: "Highlight the thin remaining sliver of parallelogram between the two arrows to show space is not fully flat yet."
    on_success: "Animate all grid points sliding onto the single line."

stage_4_formalization:
  formal_expression: "\\det(A) = 0 \\implies \\text{Singular Matrix}"
  color_mapping:
    - symbol: "\\det(A) = 0"
      matches_visual: "Zero-thickness collapsed line (White)"
    - symbol: "\\text{Singular Matrix}"
      matches_visual: "Locked padlock icon on the crushed grid"

retention_hooks:
  interleaved_variation: "Identify which of three matrix arrow pairs will crush a 2D circle into a flat segment."
  spaced_review_prompt: "Given two distinct points landing on the same spot, infer what happened to the grid area (+7d)."
```

---

### Module 2.8 · Undoing a Move (The Inverse)
```yaml
module_id: "math_linalg_inverse_08"
title: "Undoing a move"
target_skill: "Connect the inverse matrix to reversing a spatial transformation back to the original grid, and see why det = 0 blocks reversal."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 24

stage_1_anchoring:
  visual_metaphor: "A rotated and stretched grid rewinds smoothly like a tape back to upright squares, whereas a flattened line cannot un-crush."
  duration_seconds: 8
  pretraining_elements:
    - "Forward Transform (Blue grid warp)"
    - "Reverse Rewind (Emerald grid restoration)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "rewind_factor"
      visual_signaling: "Scrub between original grid (0), warped grid (1), and inverse-warped grid (-1)."
    - control_type: "toggle"
      variable_name: "toggle_singular_lock"
      visual_signaling: "Visually demonstrates multiple dots overlapping on one spot, making a unique rewind impossible."
  spatial_contiguity_rules:
    - "Attach ghost trail paths directly to grid vertices."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Set the undo arrows to bring the tilted grid back upright."
  user_action: "Adjust the inverse basis handles so the warped square returns to the 1x1 upright unit position."
  adaptive_feedback:
    on_common_misconception: "Show ghost outline of where the square actually lands versus the upright target frame."
    on_success: "Snap grid into perfect alignment with a subtle harmonic pulse."

stage_4_formalization:
  formal_expression: "A^{-1} A = I \\quad (\\det(A) \\neq 0)"
  color_mapping:
    - symbol: "A"
      matches_visual: "Forward warp arrows (Blue)"
    - symbol: "A^{-1}"
      matches_visual: "Rewind arrows (Emerald)"
    - symbol: "I"
      matches_visual: "Restored upright unit square (White)"

retention_hooks:
  interleaved_variation: "Undo a pure 90-degree rotation combined with a 2x stretch."
  spaced_review_prompt: "Predict why a matrix with area 0 has no undo button (+24h)."
```

---

### Module 2.9 · Systems Are Intersections
```yaml
module_id: "math_linalg_systems_09"
title: "Systems are intersections"
target_skill: "Interpret solving Ax = b as finding the unknown input arrow that lands on target b after transformation."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "A glowing target pin sits on the plane; a movable input arrow sweeps across the grid while its transformed shadow hunts for the target pin."
  duration_seconds: 8
  pretraining_elements:
    - "Input Arrow x (Cyan vector)"
    - "Transformed Shadow Ax (Amber vector)"
    - "Target Pin b (Coral beacon)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "input_vector_x"
      visual_signaling: "Dragging the Cyan input arrow moves its Amber transformed shadow in real time across the warped grid."
  spatial_contiguity_rules:
    - "Label 'x' on the input arrow tip and 'Ax' on the shadow tip."
    - "Display distance gap line between shadow tip and target pin."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Place the input arrow so its transformed shadow hits the target."
  user_action: "Drag the Cyan input arrow to the predicted pre-image location, then trigger the matrix warp."
  adaptive_feedback:
    on_common_misconception: "Draw a dashed discrepancy vector from where the shadow landed to the Coral target pin."
    on_success: "Lock shadow onto target pin and reveal the underlying grid coordinates."

stage_4_formalization:
  formal_expression: "A\\vec{x} = \\vec{b} \\implies \\vec{x} = A^{-1}\\vec{b}"
  color_mapping:
    - symbol: "A"
      matches_visual: "Warped grid lines (Blue)"
    - symbol: "\\vec{x}"
      matches_visual: "Input arrow (Cyan)"
    - symbol: "\\vec{b}"
      matches_visual: "Target pin (Coral)"

retention_hooks:
  interleaved_variation: "Solve for x when the target pin lies on a collapsed singular line (infinite vs. zero solutions)."
  spaced_review_prompt: "Estimate the quadrant of input x given a rotated grid and target b (+7d)."
```

---

### Module 2.10 · The Axes That Stay on Track (Eigenvectors)
```yaml
module_id: "math_linalg_eigenvectors_10"
title: "The axes that stay on track"
target_skill: "Identify eigenvectors as special directions that only stretch or flip without rotating off their span line."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 24

stage_1_anchoring:
  visual_metaphor: "A compass wheel of arrows undergoes a shear warp: almost every arrow twists sideways, except two golden arrows that stay strictly along their original laser tracks."
  duration_seconds: 9
  pretraining_elements:
    - "Rotating Arrows (faded Gray vectors knocked off track)"
    - "Invariant Track Arrows (Gold vectors staying on their span line)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "probe_angle"
      visual_signaling: "Rotate a single probe arrow 360 degrees; when it aligns with an invariant track, the track lights up Gold and shows its stretch multiplier."
  spatial_contiguity_rules:
    - "Attach stretch factor readout (e.g., '2.0x') directly beside the Gold arrow tip."
    - "Show angular deviation arc in Red whenever the arrow is off-track."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Rotate the probe arrow until it stays on its own track."
  user_action: "Sweep the angle slider to lock onto a hidden invariant direction before running the warp pulse."
  adaptive_feedback:
    on_common_misconception: "Highlight the red angular gap between the input rail and the warped output arrow."
    on_success: "Illuminate the entire infinite eigen-line in Gold."

stage_4_formalization:
  formal_expression: "A\\vec{v} = \\lambda\\vec{v}"
  color_mapping:
    - symbol: "A"
      matches_visual: "Grid warp transformation (Blue)"
    - symbol: "\\vec{v}"
      matches_visual: "On-track direction arrow (Gold)"
    - symbol: "\\lambda"
      matches_visual: "Length stretch factor along the track (Emerald)"

retention_hooks:
  interleaved_variation: "Find the second eigenvector on an asymmetric stretch matrix."
  spaced_review_prompt: "Predict what happens to a pure rotation matrix—why do no arrows stay on track? (+24h)."
```

---

## Chapter 3 · Circles, Waves & Trigonometry
**Tagline:** *From spinning wheels to endless waves.*

### Module 3.1 · Measuring Turns (Radians)
```yaml
module_id: "math_trig_radians_01"
title: "Measuring turns"
target_skill: "Understand a radian as wrapping the circle's own radius along its curved outer edge."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 20

stage_1_anchoring:
  visual_metaphor: "A rigid radius bar bends like a flexible glowing ribbon and wraps neatly around the circumference of a unit circle."
  duration_seconds: 8
  pretraining_elements:
    - "Radius Bar (Cyan straight segment, length = 1)"
    - "Wrapped Arc Ribbon (Amber curved arc along rim)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "arc_length_theta"
      visual_signaling: "Unrolls or wraps radius lengths around the circle rim, ticking softly at 1, 2, 3, and pi (~3.14) at the half-turn."
  spatial_contiguity_rules:
    - "Display live radius-count directly along the curved arc."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Wrap the ribbon halfway around the circle."
  user_action: "Drag the rim handle to estimate exact half-circle arc length before revealing the pi marker."
  adaptive_feedback:
    on_common_misconception: "Show the tiny remaining gap between 3.0 radii and the exact horizontal diameter line."
    on_success: "Highlight the full semicircle in Amber and mark pi."

stage_4_formalization:
  formal_expression: "\\theta = \\frac{s}{r} \\quad (\\text{Half turn} = \\pi\\text{ rad})"
  color_mapping:
    - symbol: "\\theta"
      matches_visual: "Central angle wedge (Gold)"
    - symbol: "s"
      matches_visual: "Wrapped arc ribbon (Amber)"
    - symbol: "r"
      matches_visual: "Circle radius bar (Cyan)"

retention_hooks:
  interleaved_variation: "Estimate a quarter-turn (pi/2) and full turn (2*pi) on circles of different sizes."
  spaced_review_prompt: "If a wheel has radius 2 and rolls 6 units, how many radians did it turn? (+24h)."
```

---

### Module 3.2 · Shadows on the Axes (Sine & Cosine)
```yaml
module_id: "math_trig_sincos_02"
title: "Shadows on the axes"
target_skill: "Visualize cosine and sine directly as the horizontal and vertical shadows of a point orbiting a unit circle."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "A glowing bead orbits a circle while perpendicular light beams cast a horizontal shadow on the floor and a vertical shadow on the wall."
  duration_seconds: 8
  pretraining_elements:
    - "Orbiting Bead (White point on unit circle)"
    - "Floor Shadow (Cyan horizontal bar)"
    - "Wall Shadow (Coral vertical bar)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "orbit_angle"
      visual_signaling: "Dragging the bead around the rim dynamically stretches, shrinks, and flips the sign of the Cyan and Coral shadow bars."
  spatial_contiguity_rules:
    - "Pin live numeric lengths directly beside the Cyan floor bar and Coral wall bar."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Move the bead where both shadows have the exact same positive length."
  user_action: "Place the bead on the circle rim before releasing the symmetry check."
  adaptive_feedback:
    on_common_misconception: "Compare the two shadow bars side-by-side in a translucent overlay to highlight length mismatch."
    on_success: "Lock at pi/4 (45 degrees) and illuminate the diagonal symmetry line."

stage_4_formalization:
  formal_expression: "(x, y) = (\\cos\\theta,\\, \\sin\\theta)"
  color_mapping:
    - symbol: "\\cos\\theta"
      matches_visual: "Horizontal floor shadow (Cyan)"
    - symbol: "\\sin\\theta"
      matches_visual: "Vertical wall shadow (Coral)"
    - symbol: "\\theta"
      matches_visual: "Orbit angle from right horizontal (Gold)"

retention_hooks:
  interleaved_variation: "Find the angle where cosine is -0.5 and sine is positive."
  spaced_review_prompt: "Predict which shadow reaches zero at the top of the circle (+24h)."
```

---

### Module 3.3 · The Slope of a Spin (Tangent)
```yaml
module_id: "math_trig_tangent_03"
title: "The slope of a spin"
target_skill: "See tangent geometrically as both the slope of the radius and the height cut on a vertical tangent wall."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "A laser ray shoots from the circle center through the orbiting bead until it strikes a vertical wall touching the right edge of the circle."
  duration_seconds: 8
  pretraining_elements:
    - "Tangent Wall (vertical rail at x = 1)"
    - "Wall Strike Height (Emerald vertical segment)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "ray_angle"
      visual_signaling: "As the bead nears the top of the circle (pi/2), the laser ray shoots upward toward infinity along the vertical wall."
  spatial_contiguity_rules:
    - "Attach live height value directly next to the Emerald segment on the tangent wall."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Aim the laser so the wall strike height equals exactly 1.0."
  user_action: "Drag the bead along the rim to hit height 1.0 on the tangent wall."
  adaptive_feedback:
    on_common_misconception: "Flash the 1.0 benchmark tick on the tangent wall relative to the current laser strike point."
    on_success: "Highlight the 1x1 right triangle formed by the radius and tangent wall."

stage_4_formalization:
  formal_expression: "\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}"
  color_mapping:
    - symbol: "\\tan\\theta"
      matches_visual: "Tangent wall segment height (Emerald)"
    - symbol: "\\sin\\theta"
      matches_visual: "Vertical shadow (Coral)"
    - symbol: "\\cos\\theta"
      matches_visual: "Horizontal shadow (Cyan)"

retention_hooks:
  interleaved_variation: "Observe what happens to the laser ray as the angle crosses straight up (pi/2)."
  spaced_review_prompt: "Why does tangent blow up to infinity when cosine equals zero? (+7d)."
```

---

### Module 3.4 · Unrolling the Circle (Waves)
```yaml
module_id: "math_trig_waves_04"
title: "Unrolling the circle"
target_skill: "Connect circular rotation over time to sinusoidal waves, controlling amplitude and frequency visually."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 24

stage_1_anchoring:
  visual_metaphor: "As the wheel spins on the left, a glowing pen attached to its vertical shadow leaves a smooth wave trail across moving paper on the right."
  duration_seconds: 9
  pretraining_elements:
    - "Spinning Wheel (left unit circle)"
    - "Unrolled Wave Trail (Coral continuous curve)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "amplitude_A"
      visual_signaling: "Scales the wheel radius and wave peak height simultaneously."
    - control_type: "slider"
      variable_name: "frequency_omega"
      visual_signaling: "Increases spin speed, packing more wave crests into the same horizontal span."
  spatial_contiguity_rules:
    - "Connect the wheel's vertical shadow to the wave pen with a horizontal dashed laser line."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Match the target ghost wave by tuning height and spin speed."
  user_action: "Set amplitude and frequency sliders before releasing the wave-drawing pen."
  adaptive_feedback:
    on_common_misconception: "Overlay the user's wave directly on top of the ghost wave, shading vertical or phase gaps."
    on_success: "Synchronize both waves into a single glowing Emerald waveform."

stage_4_formalization:
  formal_expression: "y(t) = A \\sin(\\omega t)"
  color_mapping:
    - symbol: "A"
      matches_visual: "Wheel radius / peak wave height (Cyan)"
    - symbol: "\\omega"
      matches_visual: "Wheel spin speed / wave compression (Gold)"
    - symbol: "\\sin(\\omega t)"
      matches_visual: "Unrolled vertical wave trace (Coral)"

retention_hooks:
  interleaved_variation: "Switch the pen from the vertical shadow (sine) to the horizontal shadow (cosine) to see the quarter-turn shift."
  spaced_review_prompt: "Doubling the spin frequency halves the wave's ______ (+24h)."
```

---

### Module 3.5 · Triangles Inside Circles (Pythagoras Reborn)
```yaml
module_id: "math_trig_identity_05"
title: "Triangles inside circles"
target_skill: "Derive the Pythagorean trigonometric identity visually from the constant radius of the unit circle."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "Inside the unit circle, squares grow outward from the horizontal and vertical shadow legs; their combined area always fills the fixed 1x1 radius square."
  duration_seconds: 8
  pretraining_elements:
    - "Horizontal Square (Cyan square on cos leg)"
    - "Vertical Square (Coral square on sin leg)"
    - "Total Area Gauge (fixed 1.0 container)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "circle_angle"
      visual_signaling: "As the bead moves, the Cyan square shrinks while the Coral square grows, keeping their summed area locked at 1.00."
  spatial_contiguity_rules:
    - "Display area numbers directly inside the Cyan and Coral squares."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "If the horizontal square area is 0.36, set the vertical shadow length."
  user_action: "Drag the bead until the vertical square area fills the remaining 0.64."
  adaptive_feedback:
    on_common_misconception: "Show the combined area bar overflowing or falling short of 1.00."
    on_success: "Merge both squares seamlessly into the unit square."

stage_4_formalization:
  formal_expression: "\\cos^2\\theta + \\sin^2\\theta = 1"
  color_mapping:
    - symbol: "\\cos^2\\theta"
      matches_visual: "Horizontal leg square area (Cyan)"
    - symbol: "\\sin^2\\theta"
      matches_visual: "Vertical leg square area (Coral)"
    - symbol: "1"
      matches_visual: "Unit hypotenuse square area (White)"

retention_hooks:
  interleaved_variation: "Find the two possible vertical heights when cos(theta) = 0.8."
  spaced_review_prompt: "Why can sin(theta) never exceed 1 on a unit circle? (+7d)."
```

---

## Chapter 4 · Growth, Decay & Logarithms
**Tagline:** *When the speed of growth depends on how big you already are.*

### Module 4.1 · Adding vs. Multiplying
```yaml
module_id: "math_exp_growth_01"
title: "Adding vs. multiplying"
target_skill: "Contrast constant additive steps (linear) with constant multiplicative scaling (exponential)."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "Two bar towers grow step-by-step: the Blue tower adds a fixed block each tick, while the Amber tower duplicates its entire current height each tick."
  duration_seconds: 8
  pretraining_elements:
    - "Additive Tower (Blue uniform blocks)"
    - "Multiplicative Tower (Amber self-doubling bar)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "step_count_x"
      visual_signaling: "Scrub steps 0 to 6 to watch the Amber tower overtake the Blue tower dramatically."
    - control_type: "slider"
      variable_name: "growth_base_b"
      visual_signaling: "Adjust multiplier factor (e.g., 1.5x, 2x, 3x) with live height tags."
  spatial_contiguity_rules:
    - "Anchor height labels directly atop each bar."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Predict the step where the doubling tower overtakes the +3 tower."
  user_action: "Place a crossover flag at the predicted step before running the step-by-step growth race."
  adaptive_feedback:
    on_common_misconception: "Highlight the height difference bar between both towers at the user's chosen step."
    on_success: "Celebrate crossover point and trace the smooth curve connecting bar tops."

stage_4_formalization:
  formal_expression: "f(x) = a \\cdot b^x"
  color_mapping:
    - symbol: "a"
      matches_visual: "Starting bar height at step 0 (White)"
    - symbol: "b"
      matches_visual: "Per-step multiplier factor (Amber)"
    - symbol: "x"
      matches_visual: "Number of multiplicative steps (Cyan)"

retention_hooks:
  interleaved_variation: "Compare a large starting additive tower (start = 20, +2/step) against a tiny doubling tower (start = 1, 2x/step)."
  spaced_review_prompt: "If a population triples every hour, by what factor does it grow in 3 hours? (+24h)."
```

---

### Module 4.2 · Folding and Shrinking (Negative & Fractional Exponents)
```yaml
module_id: "math_exp_fractions_02"
title: "Folding and shrinking"
target_skill: "Interpret negative exponents as stepping backward (division) and fractional exponents as halfway multiplicative steps."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "A ribbon doubles in length moving right along a number line, and folds cleanly in half moving left past zero into negative steps."
  duration_seconds: 8
  pretraining_elements:
    - "Forward Steps (rightward doubling)"
    - "Backward Steps (leftward halving)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "exponent_x"
      visual_signaling: "Continuous slider from -3.0 to +3.0, including half-steps like 0.5 and 1.5."
  spatial_contiguity_rules:
    - "Display fraction/decimal value directly inside the ribbon segment."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Set the step slider to shrink a height of 1 down to 0.25."
  user_action: "Move the continuous exponent slider to the target position before revealing the exact step."
  adaptive_feedback:
    on_common_misconception: "Show animated halving folds (1 -> 0.5 -> 0.25) to illustrate why negative exponents stay positive."
    on_success: "Highlight the symmetry between +2 (4) and -2 (1/4)."

stage_4_formalization:
  formal_expression: "b^{-x} = \\frac{1}{b^x}, \\quad b^{1/2} = \\sqrt{b}"
  color_mapping:
    - symbol: "b^{-x}"
      matches_visual: "Leftward halving ribbon (Coral)"
    - symbol: "b^{1/2}"
      matches_visual: "Half-step intermediate height (Gold)"

retention_hooks:
  interleaved_variation: "Find the intermediate half-step value between 1 and 9 (9^0.5)."
  spaced_review_prompt: "Why does 2^(-3) equal 1/8 instead of -6? (+24h)."
```

---

### Module 4.3 · The Speed Limit of Growth ($e$)
```yaml
module_id: "math_exp_euler_03"
title: "The speed limit of growth"
target_skill: "Discover Euler's number e by compounding 100% growth into infinitely many tiny continuous steps."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 24

stage_1_anchoring:
  visual_metaphor: "A bar of height 1 splits its 100% growth bonus into 1 big jump, then 2 half-jumps, then 10 tiny jumps—converging smoothly against an invisible ceiling."
  duration_seconds: 9
  pretraining_elements:
    - "Compounding Sub-steps (Cyan stacked micro-gains)"
    - "Natural Ceiling Line (Gold asymptote at ~2.718)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "split_count_n"
      visual_signaling: "Increase splits n from 1 to 1000; watch the bar climb rapidly at first and then hug the 2.718 ceiling."
  spatial_contiguity_rules:
    - "Display live height readout to 3 decimal places at the top of the bar."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Predict where the bar stops if we split growth into 1,000,000 tiny steps."
  user_action: "Place a horizontal marker on the vertical axis before running the high-frequency compounding sweep."
  adaptive_feedback:
    on_common_misconception: "Zoom in near 2.718 to show why smaller splits shrink the bonus faster than the count grows."
    on_success: "Lock the Gold ceiling line and label it e."

stage_4_formalization:
  formal_expression: "e = \\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n \\approx 2.718"
  color_mapping:
    - symbol: "e"
      matches_visual: "Natural continuous growth ceiling (Gold)"
    - symbol: "n"
      matches_visual: "Number of micro-step splits (Cyan)"

retention_hooks:
  interleaved_variation: "Compare discrete annual 100% growth (2.0) with continuous growth (2.718)."
  spaced_review_prompt: "What makes a function e^x unique in terms of its own height and growth rate? (+7d)."
```

---

### Module 4.4 · Asking "How Many Steps?" (Logarithms)
```yaml
module_id: "math_exp_logarithms_04"
title: "Asking 'How many steps?'"
target_skill: "Understand a logarithm simply as the inverse question of an exponent: counting the multiplicative steps needed to reach a target size."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "Instead of pushing a step slider to see height, you drag a target height line upward and watch a step-counter automatically click off how many doublings it takes."
  duration_seconds: 8
  pretraining_elements:
    - "Target Height Bar (Amber vertical bar)"
    - "Step Counter Ticks (Cyan horizontal step markers)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "target_value_y"
      visual_signaling: "Dragging target height between 1, 2, 4, 8, and 16 illuminates exact integer step ticks; intermediate heights show fractional steps."
  spatial_contiguity_rules:
    - "Attach 'Steps = ...' directly next to the step counter."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Set the target height that requires exactly 4 doubling steps."
  user_action: "Drag the target height handle before releasing the doubling pulse verification."
  adaptive_feedback:
    on_common_misconception: "Animate each doubling jump (1 -> 2 -> 4 -> 8 -> 16) alongside the user's chosen height."
    on_success: "Reflect the exponential curve across the diagonal y = x line to reveal the logarithm curve."

stage_4_formalization:
  formal_expression: "\\log_b(y) = x \\iff b^x = y"
  color_mapping:
    - symbol: "\\log_b"
      matches_visual: "Step-counting machine with base b (Gold)"
    - symbol: "y"
      matches_visual: "Target height input (Amber)"
    - symbol: "x"
      matches_visual: "Output step count (Cyan)"

retention_hooks:
  interleaved_variation: "Switch base from 2 to 10 and find log_10(1000)."
  spaced_review_prompt: "Why is log_2(0) undefined on our doubling machine? (+24h)."
```

---

### Module 4.5 · Log Scales (Compressing Giants)
```yaml
module_id: "math_exp_logscales_05"
title: "Log scales"
target_skill: "Use logarithmic rulers to visualize data spanning many orders of magnitude on a single screen."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "On a normal ruler, 1, 10, and 100 crush 1 and 10 into an invisible speck; switching to a log ruler spaces 1, 10, 100, and 1,000 evenly."
  duration_seconds: 8
  pretraining_elements:
    - "Linear Ruler (crushed small numbers)"
    - "Logarithmic Ruler (evenly spaced powers of 10)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "ruler_warp_factor"
      visual_signaling: "Morph smoothly between a linear axis (0) and a base-10 log axis (1), watching an exponential curve straighten into a line."
  spatial_contiguity_rules:
    - "Anchor tick values (1, 10, 100, 1000) directly onto moving grid lines."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Place 500 on the logarithmic ruler."
  user_action: "Drag the marker between 100 and 1,000 on the log scale before revealing its exact position (~2.7)."
  adaptive_feedback:
    on_common_misconception: "Highlight that the midpoint between 100 and 1000 on a log ruler is ~316 (10^2.5), not 500."
    on_success: "Confirm placement and show how multiplication turns into simple ruler addition."

stage_4_formalization:
  formal_expression: "\\log(A \\cdot B) = \\log(A) + \\log(B)"
  color_mapping:
    - symbol: "\\log(A \\cdot B)"
      matches_visual: "Combined ruler distance (Emerald)"
    - symbol: "\\log(A)"
      matches_visual: "First ruler segment (Cyan)"
    - symbol: "\\log(B)"
      matches_visual: "Second ruler segment (Amber)"

retention_hooks:
  interleaved_variation: "Compare two earthquakes separated by 2 steps on a Richter log ruler (100x amplitude)."
  spaced_review_prompt: "On a base-10 log scale, what number sits halfway between 10 and 1,000? (+7d)."
```

---

## Chapter 5 · Calculus: The Geometry of Change
**Tagline:** *Zooming in until curves become lines, and slicing shapes into infinitely thin strips.*

### Module 5.1 · Average vs. Instant Speed
```yaml
module_id: "math_calc_secant_01"
title: "Average vs. instant speed"
target_skill: "Transition visually from a two-point secant slope (average rate) to a single-point tangent slope (instantaneous rate)."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "Two glowing pins sit on a curved hill connected by a straight bridge; as the second pin slides toward the first, the bridge pivots into a smooth tangent rail."
  duration_seconds: 8
  pretraining_elements:
    - "Anchor Pin (Cyan fixed point)"
    - "Sliding Pin (Amber movable point)"
    - "Slope Bridge (White line with live steepness readout)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "step_gap_h"
      visual_signaling: "Shrink horizontal gap h from 3.0 down toward 0.01; watch the slope triangle shrink while its steepness ratio stabilizes."
  spatial_contiguity_rules:
    - "Attach live rise/run readout directly onto the shrinking slope triangle."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Predict the exact instant steepness when the gap shrinks to zero."
  user_action: "Rotate a tangent angle dial at the anchor pin before shrinking the gap h to zero."
  adaptive_feedback:
    on_common_misconception: "Overlay the user's predicted line against the converged tangent rail to highlight any angle mismatch."
    on_success: "Lock the tangent rail in Emerald."

stage_4_formalization:
  formal_expression: "f'(x) = \\lim_{h \\to 0} \\frac{f(x + h) - f(x)}{h}"
  color_mapping:
    - symbol: "f'(x)"
      matches_visual: "Final tangent rail steepness (Emerald)"
    - symbol: "f(x + h) - f(x)"
      matches_visual: "Vertical rise of slope triangle (Coral)"
    - symbol: "h"
      matches_visual: "Horizontal gap between pins (Amber)"

retention_hooks:
  interleaved_variation: "Find the instant slope on a downward-curving section of the hill."
  spaced_review_prompt: "Why can't we simply plug h = 0 into the fraction before shrinking the gap? (+24h)."
```

---

### Module 5.2 · Zooming In (The Derivative)
```yaml
module_id: "math_calc_derivative_02"
title: "Zooming in"
target_skill: "Understand local linearity: zooming into any smooth curve makes it indistinguishable from a straight line whose slope is the derivative."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "A magnifying lens zooms 100x onto a curved parabola; the bend flattens out completely into a straight line, while a twin graph below plots that slope at every x."
  duration_seconds: 8
  pretraining_elements:
    - "Curve Lens (top graph zooming into f(x))"
    - "Slope Tracker Graph (bottom graph tracing f'(x))"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "zoom_magnification"
      visual_signaling: "Zoom from 1x to 50x at any point on the curve."
    - control_type: "drag_handle"
      variable_name: "probe_x"
      visual_signaling: "Slide along the curve to simultaneously trace the straight-line derivative graph below."
  spatial_contiguity_rules:
    - "Link top probe point and bottom slope point with a vertical laser guideline."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Sketch where the slope graph goes as the curve bends from flat to steep."
  user_action: "Place three slope-height markers on the bottom graph before sweeping the probe across the parabola."
  adaptive_feedback:
    on_common_misconception: "Highlight where the curve goes downhill (negative slope below axis) versus uphill (positive slope above axis)."
    on_success: "Reveal the complete linear derivative line f'(x) = 2x."

stage_4_formalization:
  formal_expression: "\\frac{d}{dx}(x^2) = 2x"
  color_mapping:
    - symbol: "x^2"
      matches_visual: "Original parabola curve (Cyan)"
    - symbol: "2x"
      matches_visual: "Traced straight-line slope graph (Emerald)"

retention_hooks:
  interleaved_variation: "Predict the derivative graph of a straight line f(x) = 3x + 1 (a flat horizontal line at 3)."
  spaced_review_prompt: "If a curve is going downward from left to right, is its derivative positive or negative? (+24h)."
```

---

### Module 5.3 · Peaks, Valleys & Flat Spots
```yaml
module_id: "math_calc_extrema_03"
title: "Peaks, valleys, and flat spots"
target_skill: "Locate local maxima and minima by finding points where the tangent rail levels out to zero slope."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "A surfer rides a rolling wave curve; as the board crests a peak or bottoms out in a valley, a spirit-level bubble on the board centers perfectly at 0.0."
  duration_seconds: 8
  pretraining_elements:
    - "Rolling Curve (Cyan wave)"
    - "Tangent Surfboard (Amber rail with live slope bubble)"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "surfer_x"
      visual_signaling: "Dragging across the curve turns the surfboard Emerald and chimes whenever slope crosses 0.0."
  spatial_contiguity_rules:
    - "Display slope sign (+, 0, -) directly above the surfboard."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Drop pins at every peak and valley using only the slope graph below."
  user_action: "Look at where the bottom derivative curve crosses zero and place peak/valley pins on the hidden top curve."
  adaptive_feedback:
    on_common_misconception: "Reveal the top curve locally around the pin to show whether the slope changed from + to - (peak) or - to + (valley)."
    on_success: "Reveal the entire hidden roller-coaster curve matching all pins."

stage_4_formalization:
  formal_expression: "f'(x) = 0 \\implies \\text{Critical Point}"
  color_mapping:
    - symbol: "f'(x) = 0"
      matches_visual: "Horizontal Emerald tangent rail"
    - symbol: "\\text{Critical Point}"
      matches_visual: "Peak or valley pin marker (Gold)"

retention_hooks:
  interleaved_variation: "Distinguish a peak from a flat inflection shelf where slope touches zero without changing sign."
  spaced_review_prompt: "How do you tell a peak apart from a valley using the sign of the slope before and after? (+7d)."
```

---

### Module 5.4 · Adding Up Thin Slices (The Integral)
```yaml
module_id: "math_calc_integral_04"
title: "Adding up thin slices"
target_skill: "Understand the definite integral as the exact area under a curve obtained by summing infinitely thin rectangles."
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 22

stage_1_anchoring:
  visual_metaphor: "Coarse blocky rectangles under a curve slice finer and finer like a high-resolution scan until their jagged staircase top melts seamlessly into the smooth curve."
  duration_seconds: 8
  pretraining_elements:
    - "Area Bars (Cyan vertical strips)"
    - "Smooth Boundary Curve (White top profile)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider"
      variable_name: "slice_count_n"
      visual_signaling: "Increase slice count from 4 to 200; watch staircase error slivers shrink to zero while total area converges."
    - control_type: "drag_handle"
      variable_name: "right_bound_b"
      visual_signaling: "Drag the right boundary wall to sweep accumulated area."
  spatial_contiguity_rules:
    - "Display summed area readout inside the shaded region."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Drag the right boundary to capture an exact total area of 4.0."
  user_action: "Position the right boundary wall before running the fine-slice area accumulation."
  adaptive_feedback:
    on_common_misconception: "Highlight the excess or missing vertical strip between the user's boundary and the true 4.0 boundary."
    on_success: "Fill the region in smooth Emerald glow."

stage_4_formalization:
  formal_expression: "\\int_a^b f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i)\\,\\Delta x"
  color_mapping:
    - symbol: "\\int_a^b"
      matches_visual: "Stretched 'S' sum from left wall a to right wall b (Gold)"
    - symbol: "f(x)"
      matches_visual: "Height of each thin slice (Cyan)"
    - symbol: "dx"
      matches_visual: "Infinitely thin slice width (Amber)"

retention_hooks:
  interleaved_variation: "Compute area when part of the curve dips below the horizontal axis (signed negative area)."
  spaced_review_prompt: "In the integral symbol, what do f(x) and dx represent geometrically on a single slice? (+24h)."
```

---

### Module 5.5 · Two Sides of the Same Coin (Fundamental Theorem)
```yaml
module_id: "math_calc_ftc_05"
title: "Two sides of the same coin"
target_skill: "Connect derivatives and integrals: the rate at which accumulated area grows equals the height of the curve itself."
cognitive_load_budget:
  max_simultaneous_variables: 1
  on_screen_word_limit: 24

stage_1_anchoring:
  visual_metaphor: "As a moving wall sweeps right under a curve, a glowing thin sliver of new area is added at the leading edge—its growth rate matches the curve's height right at that edge."
  duration_seconds: 9
  pretraining_elements:
    - "Accumulated Area Region (Cyan shaded region A(x))"
    - "Leading Edge Slice (Amber glowing strip of height f(x))"

stage_2_exploration:
  interactive_controls:
    - control_type: "drag_handle"
      variable_name: "sweep_x"
      visual_signaling: "Dragging the leading edge shows top curve height f(x) and bottom area-growth slope A'(x) moving in lockstep."
  spatial_contiguity_rules:
    - "Align the height bar f(x) directly above the slope readout A'(x)."

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Find where the accumulated area is growing the fastest."
  user_action: "Place the leading-edge marker at the x-position of maximum area growth before running the sweep."
  adaptive_feedback:
    on_common_misconception: "Show a thin dx nudge at the user's marker versus at the curve's highest peak to compare newly added area."
    on_success: "Connect the top curve and bottom area-slope graph with synchronized Emerald pulses."

stage_4_formalization:
  formal_expression: "\\frac{d}{dx} \\int_a^x f(t)\\,dt = f(x)"
  color_mapping:
    - symbol: "\\frac{d}{dx}"
      matches_visual: "Rate of change / slope operator (Emerald)"
    - symbol: "\\int_a^x f(t)\\,dt"
      matches_visual: "Accumulated area function A(x) (Cyan)"
    - symbol: "f(x)"
      matches_visual: "Leading-edge curve height (Amber)"

retention_hooks:
  interleaved_variation: "Identify where accumulated area stops growing momentarily (where f(x) = 0)."
  spaced_review_prompt: "If a car's speed graph is f(t), what does the area under f(t) represent? (+7d)."
```

---

## Implementation Compliance Summary (Checklist Alignment)

Every module specification above enforces the 7 rules from `intuitive_interactive_learning.md`:
1. **Zero-Jargon Entry:** All `stage_1_anchoring` blocks rely purely on physical metaphors (tiles, shadows, ribbons, surfboards, slices) before introducing terminology.
2. **Control Discipline:** Every `stage_2_exploration` block restricts simultaneous interactive controls to `1` or `2` variables.
3. **Spatial Contiguity:** All numeric readouts and labels are anchored directly onto vectors, centroids, bars, or rails (`spatial_contiguity_rules`).
4. **60fps Causal Signaling:** Every control specifies immediate visual feedback (`visual_signaling`).
5. **Mandatory Prediction Gate:** Every module includes a `stage_3_prediction_loop` requiring constructive placement or parameter commitment before verification.
6. **Diagnostic Error States:** Every `on_common_misconception` handler renders a visual discrepancy overlay (ghost outlines, gap vectors, excess area slices) instead of generic text alerts.
7. **Late Formalization:** Formal LaTeX notation and symbol color-coding appear strictly in `stage_4_formalization`.