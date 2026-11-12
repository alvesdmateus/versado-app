import { and, asc, eq, inArray, isNotNull, lte } from "drizzle-orm";
import type {
  LearningChapter,
  LearningModule,
  LearningRepositories,
  LearningTrack,
  ModuleProgress,
  ModuleSpec,
  ModuleStage,
  ContentStatus,
  LearningDomain,
  ColorToken,
} from "@versado/core";
import type { Database } from "../db";
import { learningChapters, learningModules, learningTracks, moduleProgress } from "../db/schema";

type TrackRow = typeof learningTracks.$inferSelect;
type ChapterRow = typeof learningChapters.$inferSelect;
type ModuleRow = typeof learningModules.$inferSelect;
type ProgressRow = typeof moduleProgress.$inferSelect;

const toTrack = (r: TrackRow): LearningTrack => ({
  id: r.id,
  domain: r.domain as LearningDomain,
  title: r.title,
  subtitle: r.subtitle,
  description: r.description,
  icon: r.icon,
  colorToken: r.colorToken as ColorToken,
  position: r.position,
  status: r.status as ContentStatus,
});

const toChapter = (r: ChapterRow): LearningChapter => ({
  id: r.id,
  trackId: r.trackId,
  position: r.position,
  title: r.title,
  subtitle: r.subtitle,
  description: r.description,
  status: r.status as ContentStatus,
});

const toModule = (r: ModuleRow): LearningModule => ({
  id: r.id,
  trackId: r.trackId,
  chapterId: r.chapterId,
  position: r.position,
  title: r.title,
  interactive: r.interactive,
  estimatedMinutes: r.estimatedMinutes,
  prerequisites: r.prerequisites,
  status: r.status as ContentStatus,
  spec: r.spec as ModuleSpec,
});

const toProgress = (r: ProgressRow): ModuleProgress => ({
  userId: r.userId,
  moduleId: r.moduleId,
  stage: Math.min(4, Math.max(1, r.stage)) as ModuleStage,
  predictionAttempts: r.predictionAttempts,
  predictionCorrect: r.predictionCorrect,
  completedAt: r.completedAt,
  easeFactor: r.easeFactor,
  interval: r.interval,
  repetitions: r.repetitions,
  nextReviewAt: r.nextReviewAt,
  lastReviewedAt: r.lastReviewedAt,
});

/** PostgreSQL (Drizzle) adapter for the learning ports defined in @versado/core. */
export function createDrizzleLearningRepositories(db: Database): LearningRepositories {
  return {
    tracks: {
      async listPublished() {
        const rows = await db
          .select()
          .from(learningTracks)
          .where(eq(learningTracks.status, "published"))
          .orderBy(asc(learningTracks.position));
        return rows.map(toTrack);
      },
      async findById(id) {
        const [row] = await db.select().from(learningTracks).where(eq(learningTracks.id, id));
        return row ? toTrack(row) : null;
      },
      async upsert(track) {
        const values = { ...track, updatedAt: new Date() };
        await db
          .insert(learningTracks)
          .values(values)
          .onConflictDoUpdate({ target: learningTracks.id, set: values });
      },
    },
    chapters: {
      async listByTrack(trackId, opts) {
        const where = opts?.includeDrafts
          ? eq(learningChapters.trackId, trackId)
          : and(eq(learningChapters.trackId, trackId), eq(learningChapters.status, "published"));
        const rows = await db.select().from(learningChapters).where(where)
          .orderBy(asc(learningChapters.position));
        return rows.map(toChapter);
      },
      async upsert(chapter) {
        const values = { ...chapter, updatedAt: new Date() };
        await db.insert(learningChapters).values(values)
          .onConflictDoUpdate({ target: learningChapters.id, set: values });
      },
    },
    modules: {
      async listByTrack(trackId, opts) {
        const where = opts?.includeDrafts
          ? eq(learningModules.trackId, trackId)
          : and(eq(learningModules.trackId, trackId), eq(learningModules.status, "published"));
        const rows = await db
          .select()
          .from(learningModules)
          .where(where)
          .orderBy(asc(learningModules.position));
        return rows.map(toModule);
      },
      async findById(id) {
        const [row] = await db.select().from(learningModules).where(eq(learningModules.id, id));
        return row ? toModule(row) : null;
      },
      async upsert(module) {
        const values = { ...module, updatedAt: new Date() };
        await db
          .insert(learningModules)
          .values(values)
          .onConflictDoUpdate({ target: learningModules.id, set: values });
      },
    },
    progress: {
      async listForUser(userId, moduleIds) {
        if (moduleIds && moduleIds.length === 0) return [];
        const where = moduleIds
          ? and(eq(moduleProgress.userId, userId), inArray(moduleProgress.moduleId, moduleIds))
          : eq(moduleProgress.userId, userId);
        const rows = await db.select().from(moduleProgress).where(where);
        return rows.map(toProgress);
      },
      async find(userId, moduleId) {
        const [row] = await db
          .select()
          .from(moduleProgress)
          .where(and(eq(moduleProgress.userId, userId), eq(moduleProgress.moduleId, moduleId)));
        return row ? toProgress(row) : null;
      },
      async save(progress) {
        const values = { ...progress, updatedAt: new Date() };
        await db
          .insert(moduleProgress)
          .values(values)
          .onConflictDoUpdate({
            target: [moduleProgress.userId, moduleProgress.moduleId],
            set: values,
          });
      },
      async listDue(userId, now) {
        const rows = await db
          .select()
          .from(moduleProgress)
          .where(
            and(
              eq(moduleProgress.userId, userId),
              isNotNull(moduleProgress.completedAt),
              lte(moduleProgress.nextReviewAt, now)
            )
          )
          .orderBy(asc(moduleProgress.nextReviewAt));
        return rows.map(toProgress);
      },
    },
  };
}
