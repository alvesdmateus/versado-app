export interface CardTheme {
  key: string;
  name: string;
  previewColor: string;
  cardClassName: string;
  textClassName: string;
  labelClassName: string;
  answerLabelClassName: string;
  /** Optional inline style for backgrounds that can't be expressed with Tailwind alone (e.g. carbon fiber). */
  backgroundStyle?: React.CSSProperties;
}

export const CARD_THEMES: CardTheme[] = [
  {
    key: "classic",
    name: "Classic",
    previewColor: "bg-gradient-to-br from-blue-400 to-blue-600",
    cardClassName: "rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-card",
    textClassName: "text-white",
    labelClassName: "text-white/70",
    answerLabelClassName: "bg-white/20 text-white",
  },
  {
    key: "forest",
    name: "Forest",
    previewColor: "bg-gradient-to-br from-emerald-400 to-emerald-700",
    cardClassName: "rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-card",
    textClassName: "text-white",
    labelClassName: "text-white/70",
    answerLabelClassName: "bg-white/20 text-white",
  },
  {
    key: "midnight",
    name: "Midnight",
    previewColor: "bg-gradient-to-br from-slate-700 to-slate-900",
    cardClassName: "rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-card",
    textClassName: "text-white",
    labelClassName: "text-white/60",
    answerLabelClassName: "bg-white/15 text-white",
  },
  {
    key: "sunset",
    name: "Sunset",
    previewColor: "bg-gradient-to-br from-pink-500 to-orange-400",
    cardClassName: "rounded-2xl bg-gradient-to-br from-pink-500 to-orange-400 shadow-card",
    textClassName: "text-white",
    labelClassName: "text-white/70",
    answerLabelClassName: "bg-white/20 text-white",
  },
  {
    key: "royal",
    name: "Royal",
    previewColor: "bg-gradient-to-br from-violet-500 to-purple-700",
    cardClassName: "rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-card",
    textClassName: "text-white",
    labelClassName: "text-white/70",
    answerLabelClassName: "bg-white/20 text-white",
  },
  {
    key: "carbon",
    name: "Carbon",
    previewColor: "rounded-2xl",
    cardClassName: "rounded-2xl shadow-card",
    textClassName: "text-white",
    labelClassName: "text-white/60",
    answerLabelClassName: "bg-white/15 text-white",
    backgroundStyle: {
      backgroundColor: "#1a1a1a",
      backgroundImage:
        "repeating-linear-gradient(135deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 8px)",
    },
  },
];

export function getCardTheme(key?: string | null): CardTheme {
  return CARD_THEMES.find((t) => t.key === key) ?? CARD_THEMES[0]!;
}
