export const breakpoints = {
  sm: "640px", // Mobile landscape
  md: "768px", // Tablet
  lg: "1024px", // Desktop
  xl: "1280px", // Large desktop
  "2xl": "1536px", // Extra large
} as const;

export const touchTargets = {
  minimum: "44px", // iOS/Android minimum
  comfortable: "48px", // Recommended
  spacious: "56px", // Large touch areas
} as const;

export type BreakpointScale = keyof typeof breakpoints;
