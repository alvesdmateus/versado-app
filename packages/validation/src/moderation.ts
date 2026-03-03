import { z } from "zod";
import { idSchema } from "./common";

export const reportTargetTypeSchema = z.enum(["deck", "review", "user"]);
export const reportReasonSchema = z.enum([
  "inappropriate_content",
  "spam",
  "harassment",
  "intellectual_property",
  "other",
]);

export const createReportSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: idSchema,
  reason: reportReasonSchema,
  details: z.string().max(500).optional(),
});

export type ReportTargetType = z.infer<typeof reportTargetTypeSchema>;
export type ReportReason = z.infer<typeof reportReasonSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
