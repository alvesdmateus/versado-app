import { describe, test, expect } from "bun:test";
import { createDeckSchema, updateDeckSchema, listDecksSchema } from "./deck";

describe("createDeckSchema", () => {
  test("accepts minimal valid input", () => {
    const result = createDeckSchema.parse({ name: "My Deck" });
    expect(result.name).toBe("My Deck");
    expect(result.description).toBe("");
    expect(result.tags).toEqual([]);
    expect(result.visibility).toBe("private");
    expect(result.settings).toEqual({});
  });

  test("accepts full valid input", () => {
    const result = createDeckSchema.parse({
      name: "Spanish Vocab",
      description: "Common Spanish words",
      tags: ["spanish", "language"],
      visibility: "public",
      settings: { newCardsPerDay: 30, algorithm: "fsrs" },
    });
    expect(result.name).toBe("Spanish Vocab");
    expect(result.visibility).toBe("public");
    expect(result.settings.newCardsPerDay).toBe(30);
  });

  test("trims name", () => {
    const result = createDeckSchema.parse({ name: "  My Deck  " });
    expect(result.name).toBe("My Deck");
  });

  test("rejects empty name", () => {
    expect(() => createDeckSchema.parse({ name: "" })).toThrow("required");
  });

  test("rejects name longer than 100 characters", () => {
    expect(() =>
      createDeckSchema.parse({ name: "a".repeat(101) })
    ).toThrow("at most 100");
  });

  test("rejects description longer than 1000 characters", () => {
    expect(() =>
      createDeckSchema.parse({ name: "Deck", description: "a".repeat(1001) })
    ).toThrow();
  });

  test("accepts all visibility values", () => {
    for (const v of ["private", "shared", "public", "marketplace"]) {
      expect(() =>
        createDeckSchema.parse({ name: "Deck", visibility: v })
      ).not.toThrow();
    }
  });

  test("rejects invalid visibility", () => {
    expect(() =>
      createDeckSchema.parse({ name: "Deck", visibility: "hidden" })
    ).toThrow();
  });

  test("rejects settings.newCardsPerDay below 1", () => {
    expect(() =>
      createDeckSchema.parse({ name: "Deck", settings: { newCardsPerDay: 0 } })
    ).toThrow();
  });

  test("rejects settings.newCardsPerDay above 500", () => {
    expect(() =>
      createDeckSchema.parse({
        name: "Deck",
        settings: { newCardsPerDay: 501 },
      })
    ).toThrow();
  });

  test("rejects invalid algorithm", () => {
    expect(() =>
      createDeckSchema.parse({
        name: "Deck",
        settings: { algorithm: "leitner" },
      })
    ).toThrow();
  });
});

describe("updateDeckSchema", () => {
  test("accepts empty object (all optional)", () => {
    expect(() => updateDeckSchema.parse({})).not.toThrow();
  });

  test("accepts partial updates", () => {
    const result = updateDeckSchema.parse({ name: "Updated Name" });
    expect(result.name).toBe("Updated Name");
  });

  test("accepts nullable coverImageUrl", () => {
    const result = updateDeckSchema.parse({ coverImageUrl: null });
    expect(result.coverImageUrl).toBeNull();
  });

  test("rejects invalid coverImageUrl", () => {
    expect(() =>
      updateDeckSchema.parse({ coverImageUrl: "not-a-url" })
    ).toThrow();
  });

  test("accepts valid coverImageUrl", () => {
    expect(() =>
      updateDeckSchema.parse({
        coverImageUrl: "https://example.com/img.png",
      })
    ).not.toThrow();
  });
});

describe("listDecksSchema", () => {
  test("accepts empty object", () => {
    expect(() => listDecksSchema.parse({})).not.toThrow();
  });

  test("accepts visibility filter", () => {
    const result = listDecksSchema.parse({ visibility: "public" });
    expect(result.visibility).toBe("public");
  });

  test("accepts search string", () => {
    const result = listDecksSchema.parse({ search: "spanish" });
    expect(result.search).toBe("spanish");
  });

  test("rejects search longer than 100 characters", () => {
    expect(() =>
      listDecksSchema.parse({ search: "a".repeat(101) })
    ).toThrow();
  });

  test("rejects tag longer than 50 characters", () => {
    expect(() =>
      listDecksSchema.parse({ tag: "a".repeat(51) })
    ).toThrow();
  });
});
