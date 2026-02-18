import { describe, test, expect } from "bun:test";
import { idSchema, paginationSchema, sortDirectionSchema, tagsSchema } from "./common";

describe("idSchema", () => {
  test("accepts valid UUID", () => {
    expect(idSchema.parse("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "550e8400-e29b-41d4-a716-446655440000"
    );
  });

  test("rejects non-UUID string", () => {
    expect(() => idSchema.parse("not-a-uuid")).toThrow();
  });

  test("rejects empty string", () => {
    expect(() => idSchema.parse("")).toThrow();
  });

  test("rejects number", () => {
    expect(() => idSchema.parse(123)).toThrow();
  });
});

describe("paginationSchema", () => {
  test("applies defaults when empty", () => {
    const result = paginationSchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  test("coerces string numbers", () => {
    const result = paginationSchema.parse({ limit: "10", offset: "5" });
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(5);
  });

  test("rejects limit below 1", () => {
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
  });

  test("rejects limit above 100", () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  test("accepts limit boundary values", () => {
    expect(paginationSchema.parse({ limit: 1 }).limit).toBe(1);
    expect(paginationSchema.parse({ limit: 100 }).limit).toBe(100);
  });

  test("rejects negative offset", () => {
    expect(() => paginationSchema.parse({ offset: -1 })).toThrow();
  });

  test("rejects non-integer values", () => {
    expect(() => paginationSchema.parse({ limit: 1.5 })).toThrow();
  });
});

describe("sortDirectionSchema", () => {
  test("defaults to desc", () => {
    expect(sortDirectionSchema.parse(undefined)).toBe("desc");
  });

  test("accepts asc", () => {
    expect(sortDirectionSchema.parse("asc")).toBe("asc");
  });

  test("accepts desc", () => {
    expect(sortDirectionSchema.parse("desc")).toBe("desc");
  });

  test("rejects invalid direction", () => {
    expect(() => sortDirectionSchema.parse("up")).toThrow();
  });
});

describe("tagsSchema", () => {
  test("defaults to empty array", () => {
    expect(tagsSchema.parse(undefined)).toEqual([]);
  });

  test("accepts valid tags", () => {
    expect(tagsSchema.parse(["math", "science"])).toEqual(["math", "science"]);
  });

  test("trims tags", () => {
    expect(tagsSchema.parse(["  math  "])).toEqual(["math"]);
  });

  test("rejects empty string tag", () => {
    expect(() => tagsSchema.parse([""])).toThrow();
  });

  test("rejects tag longer than 50 characters", () => {
    expect(() => tagsSchema.parse(["a".repeat(51)])).toThrow();
  });

  test("rejects more than 20 tags", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
    expect(() => tagsSchema.parse(tags)).toThrow();
  });

  test("accepts exactly 20 tags", () => {
    const tags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    expect(() => tagsSchema.parse(tags)).not.toThrow();
  });
});
