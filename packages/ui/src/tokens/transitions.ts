export const transitions = {
  none: "none",
  fast: "150ms ease",
  normal: "200ms ease",
  slow: "300ms ease",
  slower: "500ms ease",
} as const;

export const durations = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

export const easings = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
} as const;

export type TransitionScale = keyof typeof transitions;
