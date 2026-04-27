export type CardLabel =
  | "common-in-exam"
  | "high-frequency"
  | "high-weight"
  | "must-know";

export const CARD_LABELS: Record<
  CardLabel,
  { color: string; bgColor: string }
> = {
  "common-in-exam": { color: "text-blue-700", bgColor: "bg-blue-100" },
  "high-frequency": { color: "text-amber-700", bgColor: "bg-amber-100" },
  "high-weight": { color: "text-purple-700", bgColor: "bg-purple-100" },
  "must-know": { color: "text-rose-700", bgColor: "bg-rose-100" },
};

export const CARD_LABEL_SET = new Set<string>(Object.keys(CARD_LABELS));

export function getCardLabels(tags: string[]): CardLabel[] {
  return tags.filter((t): t is CardLabel => CARD_LABEL_SET.has(t));
}
