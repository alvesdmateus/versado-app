import type { InteractiveDefinition } from "./types";
import { areaProduct } from "./AreaProduct";
import { binomialSquare } from "./BinomialSquare";
import { completeSquare } from "./CompleteSquare";
import { slopeIntercept } from "./SlopeIntercept";
import { lineIntersection } from "./LineIntersection";
import { linePair } from "./LinePair";
import { parabola } from "./Parabola";
import { planePoint } from "./PlanePoint";
import { vectorMove } from "./VectorMove";
import { vectorPath } from "./VectorPath";
import { matrixTransform } from "./MatrixTransform";

/** Client components keyed by `module.interactive` (the content's interactive slug). */
export const INTERACTIVES: Record<string, InteractiveDefinition> = {
  "area-product": areaProduct,
  "binomial-square": binomialSquare,
  "complete-square": completeSquare,
  "slope-intercept": slopeIntercept,
  "line-intersection": lineIntersection,
  "line-pair": linePair,
  parabola,
  "plane-point": planePoint,
  "vector-move": vectorMove,
  "vector-path": vectorPath,
  "matrix-transform": matrixTransform,
};

export function getInteractive(key: string): InteractiveDefinition | null {
  return INTERACTIVES[key] ?? null;
}

export type { InteractiveDefinition, BoardProps, BoardInput, Axis, Verdict, Values, ControlDef } from "./types";
