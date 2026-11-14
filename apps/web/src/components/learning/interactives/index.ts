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
import { matrixSystem } from "./MatrixSystem";
import { matrixEigenvector } from "./MatrixEigenvector";
import { matrixTurn } from "./MatrixTurn";
import { matrixInverse } from "./MatrixInverse";
import { matrixOrder } from "./MatrixOrder";
import { matrixArea } from "./MatrixArea";

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
  "matrix-system": matrixSystem,
  "matrix-eigenvector": matrixEigenvector,
  "matrix-turn": matrixTurn,
  "matrix-inverse": matrixInverse,
  "matrix-order": matrixOrder,
  "matrix-area": matrixArea,
};

export function getInteractive(key: string): InteractiveDefinition | null {
  return INTERACTIVES[key] ?? null;
}

export type { InteractiveDefinition, BoardProps, BoardInput, Axis, Verdict, Values, ControlDef } from "./types";
