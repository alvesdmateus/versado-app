import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { createMemoryLearningRepositories } from "@versado/core";
import { authRequest, testRequest } from "./setup";
import { sign } from "../lib/jwt";
import { setLearningRepositories } from "../repositories";
import { loadLearningContent } from "../content";

/**
 * Learning API routes, exercised against the in-memory adapter so the
 * suite runs without a database (the storage is pluggable by design).
 */
const USER_ID = "00000000-0000-4000-8000-000000000001";
const token = sign({ sub: USER_ID, email: "learner@test.dev", tier: "free" });
const [math] = loadLearningContent();
const firstModule = math!.modules[0]!.id;
const secondModule = math!.modules[1]!.id;

const post = (path: string, body: unknown) =>
  authRequest(path, token, { method: "POST", body: JSON.stringify(body) });

describe("learning routes", () => {
  beforeEach(() => {
    setLearningRepositories(
      createMemoryLearningRepositories({
        tracks: [math!.track],
        chapters: math!.chapters,
        modules: math!.modules,
      })
    );
  });

  afterAll(() => setLearningRepositories(null));

  it("requires authentication", async () => {
    const res = await testRequest("/api/learn/tracks");
    expect(res.status).toBe(401);
  });

  it("lists published tracks with only published modules counted", async () => {
    const res = await authRequest("/api/learn/tracks", token);
    expect(res.status).toBe(200);
    const { tracks } = await res.json();
    const published = math!.modules.filter((m) => m.status === "published").length;
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      id: math!.track.id,
      chapterCount: 1,
      moduleCount: published,
      completedCount: 0,
      nextModuleId: firstModule,
    });
  });

  it("returns chapters grouping the flat course modules", async () => {
    const res = await authRequest(`/api/learn/tracks/${math!.track.id}`, token);
    expect(res.status).toBe(200);
    const { track, chapters, modules } = await res.json();
    expect(track.chapterCount).toBe(1);
    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toMatchObject({ id: "math-algebra", moduleCount: modules.length, completedCount: 0 });
    expect(chapters[0].modules).toEqual(modules);
  });

  it("returns 404 for unknown tracks and 400 for malformed ids", async () => {
    expect((await authRequest("/api/learn/tracks/nope", token)).status).toBe(404);
    expect((await authRequest("/api/learn/tracks/Not%20A%20Slug", token)).status).toBe(400);
  });

  it("locks modules until the previous one is completed", async () => {
    const res = await authRequest(`/api/learn/modules/${secondModule}`, token);
    expect(res.status).toBe(403);
  });

  it("enforces the prediction gate before completion", async () => {
    const res = await post(`/api/learn/modules/${firstModule}/progress`, {
      stage: 4,
      completed: true,
    });
    expect(res.status).toBe(400);
  });

  it("walks a module through all four stages and unlocks the next", async () => {
    await post(`/api/learn/modules/${firstModule}/progress`, { stage: 2 });
    await post(`/api/learn/modules/${firstModule}/progress`, {
      stage: 3,
      predictionAttempt: { correct: true },
    });
    const done = await post(`/api/learn/modules/${firstModule}/progress`, {
      stage: 4,
      completed: true,
    });
    expect(done.status).toBe(200);
    const { progress } = await done.json();
    expect(progress.completedAt).toBeTruthy();
    expect(progress.nextReviewAt).toBeTruthy();

    const next = await authRequest(`/api/learn/modules/${secondModule}`, token);
    expect(next.status).toBe(200);

    const due = await authRequest("/api/learn/reviews/due", token);
    expect((await due.json()).reviews).toHaveLength(0);
  });

  it("rejects reviews of modules that were never completed", async () => {
    const res = await post(`/api/learn/modules/${firstModule}/review`, { correct: true });
    expect(res.status).toBe(400);
  });
});
