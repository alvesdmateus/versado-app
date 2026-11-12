import { Hono } from "hono";
import { LearningError } from "@versado/core";
import {
  slugSchema,
  submitModuleReviewSchema,
  updateModuleProgressSchema,
} from "@versado/validation";
import { validate } from "../lib/validate";
import { AppError } from "../middleware/error-handler";
import { getLearningService } from "../repositories";

/**
 * Skill-track learning API.
 *   GET  /api/learn/tracks
 *   GET  /api/learn/tracks/:trackId
 *   GET  /api/learn/modules/:moduleId
 *   POST /api/learn/modules/:moduleId/progress
 *   GET  /api/learn/reviews/due
 *   POST /api/learn/modules/:moduleId/review
 */
export const learningRoutes = new Hono();

function mapError(err: unknown): never {
  if (err instanceof LearningError) {
    const status = err.kind === "not_found" ? 404 : err.kind === "locked" ? 403 : 400;
    throw new AppError(status, err.message, `LEARNING_${err.kind.toUpperCase()}`);
  }
  throw err;
}

const param = (value: string | undefined) => validate(slugSchema, value);

learningRoutes.get("/tracks", async (c) => {
  const tracks = await getLearningService().listTracks(c.get("user").id);
  return c.json({ tracks });
});

learningRoutes.get("/tracks/:trackId", async (c) => {
  const trackId = param(c.req.param("trackId"));
  const result = await getLearningService()
    .getTrack(c.get("user").id, trackId)
    .catch(mapError);
  const { track, modules, chapters } = result;
  return c.json({ track, modules, chapters });
});

learningRoutes.get("/modules/:moduleId", async (c) => {
  const moduleId = param(c.req.param("moduleId"));
  const module = await getLearningService()
    .getModule(c.get("user").id, moduleId)
    .catch(mapError);
  return c.json({ module });
});

learningRoutes.post("/modules/:moduleId/progress", async (c) => {
  const moduleId = param(c.req.param("moduleId"));
  const input = validate(updateModuleProgressSchema, await c.req.json());
  const progress = await getLearningService()
    .updateProgress(c.get("user").id, moduleId, {
      ...input,
      stage: input.stage as 1 | 2 | 3 | 4,
    })
    .catch(mapError);
  return c.json({ progress });
});

learningRoutes.get("/reviews/due", async (c) => {
  const reviews = await getLearningService().listDueReviews(c.get("user").id);
  return c.json({ reviews });
});

learningRoutes.post("/modules/:moduleId/review", async (c) => {
  const moduleId = param(c.req.param("moduleId"));
  const input = validate(submitModuleReviewSchema, await c.req.json());
  const progress = await getLearningService()
    .submitReview(c.get("user").id, moduleId, {
      correct: input.correct,
      attempts: input.attempts ?? 1,
    })
    .catch(mapError);
  return c.json({ progress });
});
