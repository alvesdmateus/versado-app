import { apiClient } from "./api-client";

export type ReportTargetType = "deck" | "review" | "user";
export type ReportReason =
  | "inappropriate_content"
  | "spam"
  | "harassment"
  | "intellectual_property"
  | "other";

export const moderationApi = {
  report(data: {
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    details?: string;
  }) {
    return apiClient<{ success: boolean }>("/api/moderation/reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
