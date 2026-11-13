import type { ComponentType } from "react";
import type { ColorToken, ModuleSpec, ModuleStage } from "@versado/core";

export type Values = Record<string, number>;

/** Diagnostic result of a committed prediction. Never just "right/wrong". */
export interface Verdict {
  correct: boolean;
  /** Signed difference between the learner's answer and the truth, in the board's own unit. */
  delta: number;
  /**
   * Named misconception the board can diagnose: "sign" (pointing the wrong way),
   * "height" (shape and axis right, vertical offset wrong), "axis" (axis of symmetry wrong),
   * "noRoots" (the curve never reaches the floor), "doubled" (doubled the side instead of squaring it),
   * "swap" (across and up exchanged), "position" (gave the destination's address instead of the move),
   * "partial" (a sum that leaves one move out), "unmoved" (kept a point where it was before a
   * transformation), "transpose" (read a matrix's rows as its arrows).
   */
  kind?: "sign" | "height" | "axis" | "noRoots" | "doubled" | "swap" | "position" | "partial" | "unmoved" | "transpose";
}

export interface BoardProps {
  spec: ModuleSpec;
  stage: ModuleStage;
  values: Values;
  /** Target parameters for the prediction (lesson target or spaced-review target). */
  target: Values;
  /** Present after a committed prediction, until the learner changes their answer. */
  verdict: Verdict | null;
  /** 0 → 1 progress of the Stage-1 anchoring animation (1 when reduced motion). */
  anchorT: number;
  /** Increments whenever a control moves, so the board can pulse what changed. */
  changed: { name: string; tick: number } | null;
  /** 0 → 1 progress of a guided demonstration (practice), or null/undefined otherwise. */
  guide?: number | null;
  /**
   * Every control the learner may move right now (absent otherwise). The board draws rails for the
   * ones bound in `axes` and in-plane handles (vertices, lines, curves) for any of them; see `rail.tsx`.
   */
  input?: BoardInput;
}

/** A board axis a control can be bound to: x runs horizontally, y vertically. */
export type Axis = "x" | "y";

export interface BoardInput {
  controls: ControlDef[];
  onChange: (name: string, value: number) => void;
  /** Controls preset by the system (assisted completion): shown at their value, not movable. */
  locked?: string[];
}

export interface ControlDef {
  variableName: string;
  label: string;
  min: number;
  max: number;
  step: number;
  colorToken: ColorToken;
  /**
   * A discrete answer picked from options (multiple choice) instead of a continuous slider. Use it when
   * the learner predicts a result rather than tuning a quantity; build the wrong options from named
   * misconceptions so the board can still diagnose them.
   */
  choices?: number[];
}

export interface InteractiveDefinition {
  Board: ComponentType<BoardProps>;
  /**
   * Variables that live on a board axis. The board draws them as rails along that axis (horizontal
   * for x, vertical for y); every other control stays a band slider under the board.
   */
  axes?: Readonly<Record<string, Axis>>;
  /** Values the board starts from at a given stage. */
  initialValues(spec: ModuleSpec, stage: ModuleStage, target: Values): Values;
  /** Controls unlocked at the Stage-3 prediction gate (max 2). */
  predictionControls(spec: ModuleSpec, target: Values): ControlDef[];
  /** Values that represent the correct answer for a target (spec carries fixed parameters / mode). */
  solve(target: Values, spec?: ModuleSpec): Values;
  evaluate(values: Values, target: Values, tolerance: number, spec?: ModuleSpec): Verdict;
  /** Short diagnostic delta drawn on the board, e.g. "+6 tiles". */
  formatDelta(verdict: Verdict): string;
}
