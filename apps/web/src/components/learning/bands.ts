import type { ColorToken } from "@versado/core";

/** Content colour tokens plus red, the board's own signal band (current position, errors). */
export type BandToken = ColorToken | "red";

/** Map a colour token to its band colour (theme-aware CSS variable). */
export function bandColor(token: BandToken): string {
  return `var(--color-band-${token})`;
}

export const INK = "var(--color-gb-ink)";
export const MUTE = "var(--color-gb-mute)";
export const SEAM = "var(--color-gb-seam)";
export const PEG = "var(--color-gb-peg)";
export const PANEL = "var(--color-gb-panel)";
export const GROUND = "var(--color-gb-ground)";

/** Translucent fill of a band colour for areas. */
export function bandFill(token: BandToken, percent = 22): string {
  return `color-mix(in srgb, var(--color-band-${token}) ${percent}%, transparent)`;
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function fmt(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, "");
}

export function signed(n: number): string {
  const s = fmt(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s;
}
