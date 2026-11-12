import type { LearningRepositories } from "./repositories";
import type { LearningChapter, LearningModule, LearningTrack, ModuleProgress } from "./types";

/**
 * In-memory adapter for the learning ports. Used by tests and as a reference
 * implementation for plugging in other storage backends.
 */
export function createMemoryLearningRepositories(seed?: {
  tracks?: LearningTrack[];
  chapters?: LearningChapter[];
  modules?: LearningModule[];
  progress?: ModuleProgress[];
}): LearningRepositories {
  const tracks = new Map((seed?.tracks ?? []).map((t) => [t.id, t]));
  const chapters = new Map((seed?.chapters ?? []).map((c) => [c.id, c]));
  const modules = new Map((seed?.modules ?? []).map((m) => [m.id, m]));
  const progress = new Map(
    (seed?.progress ?? []).map((p) => [`${p.userId}:${p.moduleId}`, p])
  );

  return {
    tracks: {
      async listPublished() {
        return [...tracks.values()]
          .filter((t) => t.status === "published")
          .sort((a, b) => a.position - b.position);
      },
      async findById(id) {
        return tracks.get(id) ?? null;
      },
      async upsert(track) {
        tracks.set(track.id, track);
      },
    },
    chapters: {
      async listByTrack(trackId, opts) {
        return [...chapters.values()]
          .filter((c) => c.trackId === trackId && (opts?.includeDrafts || c.status === "published"))
          .sort((a, b) => a.position - b.position);
      },
      async upsert(chapter) {
        chapters.set(chapter.id, chapter);
      },
    },
    modules: {
      async listByTrack(trackId, opts) {
        return [...modules.values()]
          .filter((m) => m.trackId === trackId && (opts?.includeDrafts || m.status === "published"))
          .sort((a, b) => a.position - b.position);
      },
      async findById(id) {
        return modules.get(id) ?? null;
      },
      async upsert(module) {
        modules.set(module.id, module);
      },
    },
    progress: {
      async listForUser(userId, moduleIds) {
        return [...progress.values()].filter(
          (p) => p.userId === userId && (!moduleIds || moduleIds.includes(p.moduleId))
        );
      },
      async find(userId, moduleId) {
        return progress.get(`${userId}:${moduleId}`) ?? null;
      },
      async save(p) {
        progress.set(`${p.userId}:${p.moduleId}`, p);
      },
      async listDue(userId, now) {
        return [...progress.values()]
          .filter(
            (p) => p.userId === userId && p.completedAt && p.nextReviewAt && p.nextReviewAt <= now
          )
          .sort((a, b) => a.nextReviewAt!.getTime() - b.nextReviewAt!.getTime());
      },
    },
  };
}
