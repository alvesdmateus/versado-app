export interface CardTheme {
  key: string;
  name: string;
  previewColor: string;
  cardClassName: string;
  textClassName: string;
  labelClassName: string;
  answerLabelClassName: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    key: "classic",
    name: "Classic",
    previewColor: "bg-neutral-0 border border-neutral-200",
    cardClassName: "rounded-2xl bg-neutral-0 shadow-card",
    textClassName: "text-neutral-900",
    labelClassName: "text-primary-500",
    answerLabelClassName: "bg-success-50 text-success-600",
  },
  {
    key: "ocean",
    name: "Ocean",
    previewColor: "bg-sky-100 border border-sky-300",
    cardClassName: "rounded-2xl bg-sky-50 border border-sky-200 shadow-card",
    textClassName: "text-sky-900",
    labelClassName: "text-sky-500",
    answerLabelClassName: "bg-sky-100 text-sky-600",
  },
  {
    key: "forest",
    name: "Forest",
    previewColor: "bg-emerald-100 border border-emerald-300",
    cardClassName: "rounded-2xl bg-emerald-50 border border-emerald-200 shadow-card",
    textClassName: "text-emerald-900",
    labelClassName: "text-emerald-500",
    answerLabelClassName: "bg-emerald-100 text-emerald-600",
  },
  {
    key: "sunset",
    name: "Sunset",
    previewColor: "bg-orange-100 border border-orange-300",
    cardClassName: "rounded-2xl bg-orange-50 border border-orange-200 shadow-card",
    textClassName: "text-orange-900",
    labelClassName: "text-orange-500",
    answerLabelClassName: "bg-orange-100 text-orange-600",
  },
  {
    key: "lavender",
    name: "Lavender",
    previewColor: "bg-violet-100 border border-violet-300",
    cardClassName: "rounded-2xl bg-violet-50 border border-violet-200 shadow-card",
    textClassName: "text-violet-900",
    labelClassName: "text-violet-500",
    answerLabelClassName: "bg-violet-100 text-violet-600",
  },
  {
    key: "midnight",
    name: "Midnight",
    previewColor: "bg-neutral-800 border border-neutral-600",
    cardClassName: "rounded-2xl bg-neutral-900 border border-neutral-700 shadow-card",
    textClassName: "text-neutral-100",
    labelClassName: "text-primary-400",
    answerLabelClassName: "bg-neutral-800 text-emerald-400",
  },
  {
    key: "minimal",
    name: "Minimal",
    previewColor: "bg-neutral-0 border-2 border-neutral-300",
    cardClassName: "rounded-xl bg-neutral-0 border-2 border-neutral-200",
    textClassName: "text-neutral-900",
    labelClassName: "text-neutral-400",
    answerLabelClassName: "bg-neutral-100 text-neutral-600",
  },
  {
    key: "bold",
    name: "Bold",
    previewColor: "bg-primary-500",
    cardClassName: "rounded-3xl bg-primary-500 shadow-lg",
    textClassName: "text-white",
    labelClassName: "text-white/70",
    answerLabelClassName: "bg-white/20 text-white",
  },
];

export function getCardTheme(key?: string | null): CardTheme {
  return CARD_THEMES.find((t) => t.key === key) ?? CARD_THEMES[0]!;
}
