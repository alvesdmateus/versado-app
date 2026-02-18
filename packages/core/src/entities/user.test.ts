import { describe, test, expect } from "bun:test";
import { createUser } from "./user";

describe("createUser", () => {
  test("creates user with required fields", () => {
    const user = createUser({
      email: "test@example.com",
      displayName: "Test User",
    });
    expect(user.email).toBe("test@example.com");
    expect(user.displayName).toBe("Test User");
  });

  test("generates UUID id", () => {
    const user = createUser({
      email: "test@example.com",
      displayName: "Test",
    });
    expect(user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  test("generates unique ids", () => {
    const user1 = createUser({ email: "a@b.com", displayName: "A" });
    const user2 = createUser({ email: "c@d.com", displayName: "B" });
    expect(user1.id).not.toBe(user2.id);
  });

  test("defaults tier to free", () => {
    const user = createUser({
      email: "test@example.com",
      displayName: "Test",
    });
    expect(user.tier).toBe("free");
  });

  test("accepts custom tier", () => {
    const user = createUser({
      email: "test@example.com",
      displayName: "Test",
      tier: "fluent",
    });
    expect(user.tier).toBe("fluent");
  });

  test("defaults avatarUrl to null", () => {
    const user = createUser({
      email: "test@example.com",
      displayName: "Test",
    });
    expect(user.avatarUrl).toBeNull();
  });

  test("accepts custom avatarUrl", () => {
    const user = createUser({
      email: "test@example.com",
      displayName: "Test",
      avatarUrl: "https://example.com/avatar.png",
    });
    expect(user.avatarUrl).toBe("https://example.com/avatar.png");
  });

  test("sets createdAt and updatedAt to current time", () => {
    const before = new Date();
    const user = createUser({
      email: "test@example.com",
      displayName: "Test",
    });
    const after = new Date();
    expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
  });
});
