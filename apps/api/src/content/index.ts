import {
  learningChapterSchema,
  learningModuleSchema,
  learningTrackSchema,
  type LearningChapterContent,
  type LearningModuleContent,
  type LearningTrackContent,
} from "@versado/validation";
import { algebraChapter, algebraModules, mathTrack } from "./mathematics";
import { vectorsChapter, vectorsModules } from "./vectors";
import { trigChapter, trigModules } from "./trigonometry";
import { growthChapter, growthModules } from "./growth";
import { calculusChapter, calculusModules } from "./calculus";

/**
 * Versioned Course (track) → Chapter → Module content, validated against the
 * bible-derived schemas and upserted by `bun run db:seed-learning`.
 */
const SOURCES = [
  {
    track: mathTrack,
    chapters: [
      { chapter: algebraChapter, modules: algebraModules },
      { chapter: vectorsChapter, modules: vectorsModules },
      { chapter: trigChapter, modules: trigModules },
      { chapter: growthChapter, modules: growthModules },
      { chapter: calculusChapter, modules: calculusModules },
    ],
  },
];

export interface LearningContent {
  track: LearningTrackContent;
  chapters: LearningChapterContent[];
  modules: LearningModuleContent[];
}

export function loadLearningContent(): LearningContent[] {
  return SOURCES.map(({ track, chapters }) => {
    const parsedTrack = learningTrackSchema.parse(track);
    const parsed = chapters.map(({ chapter, modules }) => {
      const parsedChapter = learningChapterSchema.parse(chapter);
      if (parsedChapter.trackId !== parsedTrack.id) {
        throw new Error(`Chapter "${chapter.id}" belongs to "${parsedChapter.trackId}", not "${parsedTrack.id}"`);
      }
      const parsedModules = modules.map((m) => {
        const result = learningModuleSchema.safeParse(m);
        if (!result.success) {
          const issues = result.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
          throw new Error(`Invalid module "${m.id}": ${issues}`);
        }
        if (result.data.trackId !== parsedTrack.id || result.data.chapterId !== parsedChapter.id) {
          throw new Error(`Module "${m.id}" must belong to track "${parsedTrack.id}" and chapter "${parsedChapter.id}"`);
        }
        return result.data;
      }).sort((a, b) => a.position - b.position);
      return { chapter: parsedChapter, modules: parsedModules };
    }).sort((a, b) => a.chapter.position - b.chapter.position);
    return {
      track: parsedTrack,
      chapters: parsed.map(({ chapter }) => chapter),
      modules: parsed.flatMap(({ modules }) => modules),
    };
  });
}
