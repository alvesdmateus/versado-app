import { z } from "zod";

/**
 * Learning-track content schemas.
 *
 * These encode the rules of `intuitive_interactive_learning.md` (the Versado bible)
 * as hard constraints, so content that breaks them cannot be seeded or served:
 * - max 2 simultaneous interactive variables (Cognitive Load / Control Constraints)
 * - on-screen word budget <= 25 (Modality Principle)
 * - challenge prompt <= 12 words (Prediction Loop)
 * - Stage 1 anchoring <= 10s (ICAP: passive use sparingly)
 */

export const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, "Must be a lowercase slug");

export const learningDomainSchema = z.enum(["mathematics", "software", "science"]);

export const contentStatusSchema = z.enum(["draft", "published"]);

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Learner-facing micro-prompt: short, synchronized with motion (Modality Principle). */
const microPrompt = (maxWords: number) =>
  z
    .string()
    .min(1)
    .refine((s) => wordCount(s) <= maxWords, `Must be at most ${maxWords} words`);

const colorTokenSchema = z.enum([
  "blue",
  "amber",
  "emerald",
  "rose",
  "violet",
  "slate",
]);

const controlSchema = z.object({
  controlType: z.enum(["slider", "drag_handle", "toggle"]),
  variableName: z.string().min(1).max(40),
  label: z.string().min(1).max(24),
  min: z.number(),
  max: z.number(),
  step: z.number().positive().default(1),
  initial: z.number(),
  colorToken: colorTokenSchema,
  visualSignaling: z.string().min(1).max(200),
  /** A toggle's two states, named in words (min, then max): shown as two options, never a 0..1 slider. */
  stateLabels: z.tuple([z.string().min(1).max(24), z.string().min(1).max(24)]).optional(),
}).refine((c) => c.controlType !== "toggle" || (c.stateLabels !== undefined && c.min !== c.max), {
  message: "A toggle needs stateLabels for its two states",
  path: ["stateLabels"],
});

export const fadeSchema = z.enum(["guided", "assisted", "autonomous"]);
const FADE_ORDER = { guided: 0, assisted: 1, autonomous: 2 } as const;

const practiceItemSchema = z.object({
  prompt: microPrompt(12),
  fade: fadeSchema,
  target: z.record(z.number()),
  /** Assisted completion: these controls start at their solved value and stay locked. */
  presetControls: z.array(z.string()).default([]),
});

export const moduleSpecSchema = z
  .object({
    targetSkill: z.string().min(1).max(160),
    cognitiveLoadBudget: z.object({
      maxSimultaneousVariables: z.number().int().min(1).max(2),
      onScreenWordLimit: z.number().int().min(1).max(25),
    }),
    stage1Anchoring: z.object({
      visualMetaphor: z.string().min(1).max(300),
      caption: microPrompt(12),
      durationSeconds: z.number().min(1).max(10),
      pretrainingElements: z
        .array(
          z.object({
            label: z.string().min(1).max(24),
            colorToken: colorTokenSchema,
          })
        )
        .min(1)
        .max(4),
    }),
    stage2Exploration: z.object({
      prompt: microPrompt(12),
      controls: z.array(controlSchema).min(1).max(2),
      /**
       * Parameters held constant while exploring (visual pretraining: isolate one building block,
       * e.g. explore the slope with the intercept fixed at 0).
       */
      fixed: z.record(z.number()).default({}),
      spatialContiguityRules: z.array(z.string().min(1).max(200)).default([]),
    }),
    stage3Prediction: z.object({
      icapTarget: z.enum(["constructive", "interactive"]),
      challengePrompt: microPrompt(12),
      userAction: z.string().min(1).max(200),
      /** Interactive-specific target parameters (e.g. the a/b values to predict for). */
      target: z.record(z.number()),
      /** Accepted absolute error when the answer is numeric. */
      tolerance: z.number().min(0).default(0),
      adaptiveFeedback: z.object({
        onCommonMisconception: microPrompt(16),
        onSuccess: microPrompt(16),
        /** Shown when the answer points the wrong way (e.g. the sign of a slope), if the interactive detects it. */
        onSignError: microPrompt(16).optional(),
        /** Diagnostic copy per misconception the interactive names (e.g. "height", "axis"). */
        byKind: z.record(microPrompt(16)).optional(),
      }),
    }),
    stage4Formalization: z.object({
      formalExpression: z.string().min(1).max(120),
      caption: microPrompt(16),
      colorMapping: z
        .array(
          z.object({
            symbol: z.string().min(1).max(24),
            matchesVisual: z.string().min(1).max(80),
            colorToken: colorTokenSchema,
          })
        )
        .min(1)
        .max(6),
    }),
    retentionHooks: z.object({
      interleavedVariation: z.string().min(1).max(200),
      spacedReviewPrompt: microPrompt(12),
      /** Alternative target used by the spaced prediction check (interleaved variation). */
      reviewTarget: z.record(z.number()),
      /**
       * Confirmation for a correct review. Stage 3's onSuccess names the lesson's own target,
       * so the review (which uses reviewTarget) needs copy that matches its board.
       */
      reviewOnSuccess: microPrompt(16),
      reviewIntervalsDays: z.array(z.number().int().positive()).min(1).default([1, 7]),
    }),
    /**
     * Optional exercises after formalization, following the bible's Faded Worked Examples:
     * guided demonstration → assisted completion → autonomous execution.
     */
    practice: z
      .object({
        items: z.array(practiceItemSchema).min(2).max(6),
      })
      .optional(),
  })
  .superRefine((spec, ctx) => {
    if (spec.stage2Exploration.controls.length > spec.cognitiveLoadBudget.maxSimultaneousVariables) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "stage2Exploration exposes more controls than maxSimultaneousVariables",
        path: ["stage2Exploration", "controls"],
      });
    }
    const items = spec.practice?.items ?? [];
    // Scaffolding only fades: never return to more help after less.
    for (let i = 1; i < items.length; i++) {
      if (FADE_ORDER[items[i]!.fade] < FADE_ORDER[items[i - 1]!.fade]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "practice items must fade from guided to assisted to autonomous",
          path: ["practice", "items", i, "fade"],
        });
      }
    }
    const controlNames = new Set(spec.stage2Exploration.controls.map((c) => c.variableName));
    items.forEach((item, i) => {
      for (const name of item.presetControls) {
        if (!controlNames.has(name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `presetControls references unknown control "${name}"`,
            path: ["practice", "items", i, "presetControls"],
          });
        }
      }
      if (item.fade === "assisted" && item.presetControls.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "an assisted item must preset at least one control",
          path: ["practice", "items", i, "presetControls"],
        });
      }
    });
  });

export const learningModuleSchema = z.object({
  id: slugSchema,
  trackId: slugSchema,
  chapterId: slugSchema,
  position: z.number().int().min(0),
  title: z.string().min(1).max(80),
  /** Key of the client-side interactive component that renders this module. */
  interactive: slugSchema,
  estimatedMinutes: z.number().int().min(1).max(30),
  prerequisites: z.array(slugSchema).default([]),
  status: contentStatusSchema.default("draft"),
  spec: moduleSpecSchema,
});

export const learningChapterSchema = z.object({
  id: slugSchema,
  trackId: slugSchema,
  position: z.number().int().min(0),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(160).default(""),
  description: z.string().max(400).default(""),
  status: contentStatusSchema,
});

export const learningTrackSchema = z.object({
  id: slugSchema,
  domain: learningDomainSchema,
  title: z.string().min(1).max(80),
  subtitle: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  icon: z.string().min(1).max(40),
  colorToken: colorTokenSchema,
  position: z.number().int().min(0),
  status: contentStatusSchema.default("draft"),
});

export const moduleStageSchema = z.number().int().min(1).max(4);

export const updateModuleProgressSchema = z.object({
  /** Highest stage the learner has reached (1-4). */
  stage: moduleStageSchema,
  /** Records one committed prediction at the Stage-3 gate. */
  predictionAttempt: z
    .object({
      correct: z.boolean(),
    })
    .optional(),
  completed: z.boolean().optional(),
});

export const submitModuleReviewSchema = z.object({
  /** Whether the spaced prediction check was answered within tolerance. */
  correct: z.boolean(),
  /** Number of attempts before getting it right (1 = first try). */
  attempts: z.number().int().min(1).max(10).default(1),
});

export type LearningDomain = z.infer<typeof learningDomainSchema>;
export type ModuleSpec = z.infer<typeof moduleSpecSchema>;
export type ModuleSpecInput = z.input<typeof moduleSpecSchema>;
export type LearningModuleInput = z.input<typeof learningModuleSchema>;
export type LearningModuleContent = z.infer<typeof learningModuleSchema>;
export type LearningChapterInput = z.input<typeof learningChapterSchema>;
export type LearningChapterContent = z.infer<typeof learningChapterSchema>;
export type LearningTrackInput = z.input<typeof learningTrackSchema>;
export type LearningTrackContent = z.infer<typeof learningTrackSchema>;
export type UpdateModuleProgressInput = z.infer<typeof updateModuleProgressSchema>;
export type SubmitModuleReviewInput = z.infer<typeof submitModuleReviewSchema>;
export type ColorToken = z.infer<typeof colorTokenSchema>;
export type Fade = z.infer<typeof fadeSchema>;
export type PracticeItem = z.infer<typeof practiceItemSchema>;
