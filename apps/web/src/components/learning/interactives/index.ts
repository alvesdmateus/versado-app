import type { InteractiveDefinition } from "./types";
import { areaProduct } from "./AreaProduct";
import { binomialSquare } from "./BinomialSquare";
import { slopeIntercept } from "./SlopeIntercept";
import { lineIntersection } from "./LineIntersection";
import { parabola } from "./Parabola";

/** Client components keyed by `module.interactive` (the content's interactive slug). */
export const INTERACTIVES: Record<string, InteractiveDefinition> = {
  "area-product": areaProduct,
  "binomial-square": binomialSquare,
  "slope-intercept": slopeIntercept,
  "line-intersection": lineIntersection,
  parabola,
};

export function getInteractive(key: string): InteractiveDefinition | null {
  return INTERACTIVES[key] ?? null;
}

export type { InteractiveDefinition, BoardProps, Verdict, Values, ControlDef } from "./types";
