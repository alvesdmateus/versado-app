import {
  learningModuleSchema,
  learningTrackSchema,
  type LearningModuleContent,
  type LearningTrackContent,
} from "@versado/validation";
import { mathModules, mathTrack } from "./math-algebra-geometry";

/**
 * Versioned learning content. Authored here, validated against the bible-derived
 * schemas, and upserted into the database by `bun run db:seed-learning`.
 */
const SOURCES = [{ track: mathTrack, modules: mathModules }];

export interface LearningContent {
  track: LearningTrackContent;
  modules: LearningModuleContent[];
}

export function loadLearningContent(): LearningContent[] {
  return SOURCES.map(({ track, modules }) => {
    const parsedTrack = learningTrackSchema.parse(track);
    const parsedModules = modules.map((m) => {
      const result = learningModuleSchema.safeParse(m);
      if (!result.success) {
        const issues = result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        throw new Error(`Invalid module "${m.id}": ${issues}`);
      }
      if (result.data.trackId !== parsedTrack.id) {
        throw new Error(`Module "${m.id}" belongs to "${result.data.trackId}", not "${parsedTrack.id}"`);
      }
      return result.data;
    });
    return { track: parsedTrack, modules: parsedModules };
  });
}
