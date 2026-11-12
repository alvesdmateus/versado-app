# Intuitive & Interactive Learning Architecture Guide

This document defines the instructional design rules, user interface (UI) constraints, and module templates for building intuitive, interactive learning experiences grounded in cognitive science.

---

## 1. Core Scientific Principles & UI Rules

### 1.1 Cognitive Load Management (Sweller, 1988)
Human working memory can process only a few novel elements simultaneously. Every decorative graphic or poorly placed label steals cognitive capacity from conceptual understanding.

* **Visual Pretraining:** Introduce isolated building blocks before showing how they interact. Never display a complex formula, syntax, or multi-part system before the user has manipulated its individual components.
* **Spatial Contiguity:** Eliminate separate legends or sidebars that force eye-jumping. Anchor labels, dynamic values, and indicators directly onto the corresponding vectors, edges, or interactive elements.
* **Faded Worked Examples:** Never drop beginners into a blank canvas. Structure skill progression across three scaffolding stages:
  1. **Guided Demonstration:** The system performs the complete transformation while visually highlighting each step.
  2. **Assisted Completion:** The system completes ~70% of the setup and pauses for the user to adjust the final parameter.
  3. **Autonomous Execution:** The user builds the configuration from scratch given only a target state.

### 1.2 Interactive Multimedia & Feedback Loops (Moreno & Mayer, 2007; Wieman et al., 2008)
Visual/spatial and auditory/verbal channels operate in parallel, but overload quickly when presented with redundant text.

* **Modality Principle (Visuals + Audio over Walls of Text):** Replace long on-screen paragraphs with concise audio narration or micro-prompts synchronized with visual motion. Reserve on-screen text strictly for short labels, key symbols, and live numeric readouts.
* **Immediate Causal Signaling (< 16ms / 60fps):** Whenever a user manipulates a variable, highlight the exact visual consequence instantaneously using color contrast, pulses, or guide lines. Users must never have to search the screen to figure out *what* changed.
* **Control Constraints & Segmentation:** Break lessons into 15–30 second micro-scenes. Limit initial interactive controls to **1 or 2 variables** at a time to prevent cognitive paralysis.

### 1.3 The ICAP Engagement Ladder (Chi & Wylie, 2014)
Learning depth scales strictly with observable user behavior: **Passive < Active < Constructive < Interactive**.

| ICAP Level | User Action | Implementation Standard |
| :--- | :--- | :--- |
| **1. Passive** | Watches or reads without intervening. | Use sparingly (< 10 seconds) only to set initial context. |
| **2. Active** | Manipulates the physical presentation. | Direct manipulation: dragging vertices, scrubbing timelines, or adjusting sliders with live visual feedback. |
| **3. Constructive** | Generates a prediction or original output. | **Prediction Loops:** Freeze the simulation before a state change and require the user to place a marker, estimate an outcome, or assemble missing parts before running. |
| **4. Interactive** | Dialogues with adaptive system feedback. | **Diagnostic Feedback:** Never show generic *"Correct / Incorrect"* alerts. Highlight the exact visual discrepancy caused by the user's input so they can self-correct. |

### 1.4 Long-Term Retention Mechanics (Dunlosky et al., 2013; Roediger & Karpicke, 2006)
* **Retrieval Before Fluency:** Force active recall early through micro-challenges before the user feels "ready." Passive review creates an illusion of competence without durable memory consolidation.
* **Spaced & Interleaved Practice:** Re-introduce mastered concepts at expanding intervals and mix different problem types within the same practice session so users learn *which* mental model applies, not just how to repeat a single mechanic.

---

## 2. The 4-Stage Lesson Blueprint

Every conceptual unit or interactive screen must follow this four-step sequence:

1. **Stage 1 — Geometric or Physical Anchoring (0–10s):** Present the phenomenon in pure visual or physical form with **zero jargon, numbers, or formal notation**. Let motion and spatial proportion communicate the core intuition.
2. **Stage 2 — Guided Free Exploration:** Unlock 1–2 direct manipulation controls (sliders, draggable nodes) with instant 60fps visual cause-and-effect indicators.
3. **Stage 3 — Prediction Pause (Retrieval Gate):** Present a target state and require the user to commit to a prediction or parameter adjustment *before* unlocking the verification animation.
4. **Stage 4 — Symbolic Formalization:** Introduce the formal equation, rule, or technical terminology only at the end, color-coding each symbol to match the visual components the user just manipulated.

---

## 3. Reusable Module Template (YAML)

Use this schema to specify every new interactive skill module before UI implementation:

```yaml
module_id: "skill_domain_concept_01"
title: "Concept Name"
target_skill: "Core intuitive takeaway in one sentence"
cognitive_load_budget:
  max_simultaneous_variables: 2
  on_screen_word_limit: 25

stage_1_anchoring:
  visual_metaphor: "Describe the pure visual/physical phenomenon without symbols"
  duration_seconds: 8
  pretraining_elements:
    - "Element A (visual label + color token)"
    - "Element B (visual label + color token)"

stage_2_exploration:
  interactive_controls:
    - control_type: "slider | drag_handle | toggle"
      variable_name: "param_a"
      visual_signaling: "Highlight affected area/vector in real time"
  spatial_contiguity_rules:
    - "Attach live value directly to moving object"

stage_3_prediction_loop:
  icap_target: "Constructive -> Interactive"
  challenge_prompt: "Short action prompt (max 12 words)"
  user_action: "Drag target marker / set parameter before running simulation"
  adaptive_feedback:
    on_common_misconception: "Visually highlight the missing/excess region instead of showing 'Wrong'"
    on_success: "Trigger smooth confirmation transition to formalization"

stage_4_formalization:
  formal_expression: "e.g., (a + b)^2 = a^2 + 2ab + b^2"
  color_mapping:
    - symbol: "a^2"
      matches_visual: "Primary square region (Blue)"
    - symbol: "2ab"
      matches_visual: "Two side rectangles (Amber)"
    - symbol: "b^2"
      matches_visual: "Corner square region (Emerald)"

retention_hooks:
  interleaved_variation: "Follow-up challenge altering orientation or constraints"
  spaced_review_prompt: "Quick 10-second prediction check queued for +24h / +7d"
```

---

## 4. Pre-Production Screen Validation Checklist

Before shipping any interactive lesson screen, verify every item below:

- [ ] **Zero-Jargon Entry:** Can a beginner understand Stage 1 within 10 seconds without reading technical definitions?
- [ ] **Control Discipline:** Are initial on-screen controls restricted to 1 or 2 meaningful variables?
- [ ] **Spatial Contiguity:** Are all labels and live numbers anchored directly to the visual elements they describe (no detached legends)?
- [ ] **60fps Causal Signaling:** Does moving a control immediately highlight the resulting visual change?
- [ ] **Mandatory Prediction Gate:** Does the user have to make a prediction or construct a state before seeing the final answer?
- [ ] **Diagnostic Error States:** Do wrong answers visually explain *why* the result missed the target rather than displaying a generic error message?
- [ ] **Late Formalization:** Are equations, rules, and formal terms introduced *only after* hands-on visual intuition has been established?