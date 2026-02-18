import { describe, test, expect } from "bun:test";
import {
  followUserSchema,
  followTagSchema,
  feedQuerySchema,
  popularDecksQuerySchema,
} from "./social";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("followUserSchema", () => {
  test("accepts valid userId", () => {
    expect(followUserSchema.parse({ userId: UUID }).userId).toBe(UUID);
  });

  test("rejects invalid userId", () => {
    expect(() => followUserSchema.parse({ userId: "bad" })).toThrow();
  });
});

describe("followTagSchema", () => {
  test("accepts valid tag", () => {
    expect(followTagSchema.parse({ tag: "spanish" }).tag).toBe("spanish");
  });

  test("trims tag", () => {
    expect(followTagSchema.parse({ tag: "  math  " }).tag).toBe("math");
  });

  test("rejects empty tag", () => {
    expect(() => followTagSchema.parse({ tag: "" })).toThrow();
  });

  test("rejects tag longer than 50 characters", () => {
    expect(() =>
      followTagSchema.parse({ tag: "a".repeat(51) })
    ).toThrow();
  });
});

describe("feedQuerySchema", () => {
  test("applies defaults", () => {
    const result = feedQuerySchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.filter).toBe("all");
  });

  test("accepts all filter values", () => {
    for (const f of ["all", "users", "tags"]) {
      expect(feedQuerySchema.parse({ filter: f }).filter).toBe(f);
    }
  });

  test("rejects invalid filter", () => {
    expect(() => feedQuerySchema.parse({ filter: "decks" })).toThrow();
  });
});

describe("popularDecksQuerySchema", () => {
  test("applies defaults", () => {
    const result = popularDecksQuerySchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.period).toBe("month");
  });

  test("accepts all period values", () => {
    for (const p of ["week", "month", "all"]) {
      expect(popularDecksQuerySchema.parse({ period: p }).period).toBe(p);
    }
  });

  test("rejects invalid period", () => {
    expect(() =>
      popularDecksQuerySchema.parse({ period: "year" })
    ).toThrow();
  });
});
