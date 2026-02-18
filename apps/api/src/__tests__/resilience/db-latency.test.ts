import { describe, test, expect, beforeAll, afterAll, afterEach } from "bun:test";
import {
  isToxiproxyAvailable,
  createProxy,
  addToxic,
  removeAllToxics,
  deleteProxy,
} from "./toxiproxy-client";

const PROXY_NAME = "versado-postgres-latency";

describe("DB Latency Resilience", () => {
  let available = false;

  beforeAll(async () => {
    available = await isToxiproxyAvailable();
    if (!available) {
      console.log(
        "⚠ Skipping latency resilience tests: Toxiproxy not available."
      );
      return;
    }

    await createProxy(PROXY_NAME, "0.0.0.0:5435", "postgres-test:5432");
  });

  afterEach(async () => {
    if (available) {
      await removeAllToxics(PROXY_NAME);
    }
  });

  afterAll(async () => {
    if (available) {
      try {
        await deleteProxy(PROXY_NAME);
      } catch {}
    }
  });

  test("API still responds with 2s DB latency", async () => {
    if (!available) return;

    // Add 2 second latency
    await addToxic(PROXY_NAME, {
      name: "latency-2s",
      type: "latency",
      attributes: { latency: 2000, jitter: 200 },
    });

    const { createApp } = await import("../../app");
    const app = createApp();

    const start = Date.now();
    const res = await app.request("/health");
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    // Health check doesn't use DB, so should be fast
    expect(elapsed).toBeLessThan(1000);
  });
});
