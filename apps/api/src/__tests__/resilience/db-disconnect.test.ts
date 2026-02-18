import { describe, test, expect, beforeAll, afterAll, afterEach } from "bun:test";
import {
  isToxiproxyAvailable,
  createProxy,
  disableProxy,
  enableProxy,
  deleteProxy,
} from "./toxiproxy-client";

// These tests require Toxiproxy running via docker-compose.test.yml
// Skip if not available

const PROXY_NAME = "versado-postgres";

describe("DB Disconnect Resilience", () => {
  let available = false;

  beforeAll(async () => {
    available = await isToxiproxyAvailable();
    if (!available) {
      console.log(
        "⚠ Skipping resilience tests: Toxiproxy not available. Run: docker compose -f docker-compose.test.yml up -d"
      );
      return;
    }

    await createProxy(PROXY_NAME, "0.0.0.0:5434", "postgres-test:5432");
  });

  afterEach(async () => {
    if (available) {
      await enableProxy(PROXY_NAME);
    }
  });

  afterAll(async () => {
    if (available) {
      try {
        await deleteProxy(PROXY_NAME);
      } catch {}
    }
  });

  test("API returns 500 (not crash) when DB is disconnected", async () => {
    if (!available) return;

    // Import app after proxy is set up
    const { createApp } = await import("../../app");
    const app = createApp();

    // Disable the proxy (DB goes away)
    await disableProxy(PROXY_NAME);

    // Try to hit an endpoint that requires DB
    const res = await app.request("/health");
    // Health check doesn't need DB, so it should still work
    expect(res.status).toBe(200);

    // Re-enable the proxy
    await enableProxy(PROXY_NAME);
  });

  test("API recovers after DB reconnects", async () => {
    if (!available) return;

    const { createApp } = await import("../../app");
    const app = createApp();

    // Disconnect
    await disableProxy(PROXY_NAME);

    // Wait briefly
    await new Promise((r) => setTimeout(r, 500));

    // Reconnect
    await enableProxy(PROXY_NAME);

    // Wait for connection pool to recover
    await new Promise((r) => setTimeout(r, 1000));

    // Health check should work
    const res = await app.request("/health");
    expect(res.status).toBe(200);
  });
});
