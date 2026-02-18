import { describe, test, expect } from "bun:test";
import {
  listMarketplaceSchema,
  purchaseDeckSchema,
  createReviewSchema,
  listDeckSchema,
  unlistDeckSchema,
} from "./marketplace";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("listMarketplaceSchema", () => {
  test("applies defaults", () => {
    const result = listMarketplaceSchema.parse({});
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.sortBy).toBe("popular");
  });

  test("accepts all sortBy values", () => {
    for (const s of ["newest", "popular", "rating", "price_asc", "price_desc"]) {
      expect(() =>
        listMarketplaceSchema.parse({ sortBy: s })
      ).not.toThrow();
    }
  });

  test("rejects invalid sortBy", () => {
    expect(() =>
      listMarketplaceSchema.parse({ sortBy: "alphabetical" })
    ).toThrow();
  });

  test("accepts minRating in valid range", () => {
    expect(listMarketplaceSchema.parse({ minRating: "3" }).minRating).toBe(3);
  });

  test("rejects minRating below 1", () => {
    expect(() =>
      listMarketplaceSchema.parse({ minRating: 0 })
    ).toThrow();
  });

  test("rejects minRating above 5", () => {
    expect(() =>
      listMarketplaceSchema.parse({ minRating: 6 })
    ).toThrow();
  });

  test("accepts search and tag filters", () => {
    const result = listMarketplaceSchema.parse({
      search: "spanish",
      tag: "language",
    });
    expect(result.search).toBe("spanish");
    expect(result.tag).toBe("language");
  });
});

describe("purchaseDeckSchema", () => {
  test("accepts valid deckId", () => {
    expect(purchaseDeckSchema.parse({ deckId: UUID }).deckId).toBe(UUID);
  });

  test("rejects invalid deckId", () => {
    expect(() => purchaseDeckSchema.parse({ deckId: "bad" })).toThrow();
  });
});

describe("createReviewSchema", () => {
  test("accepts valid review", () => {
    const result = createReviewSchema.parse({
      deckId: UUID,
      rating: 4,
      comment: "Great deck!",
    });
    expect(result.rating).toBe(4);
    expect(result.comment).toBe("Great deck!");
  });

  test("comment is optional", () => {
    expect(() =>
      createReviewSchema.parse({ deckId: UUID, rating: 5 })
    ).not.toThrow();
  });

  test("rejects rating below 1", () => {
    expect(() =>
      createReviewSchema.parse({ deckId: UUID, rating: 0 })
    ).toThrow();
  });

  test("rejects rating above 5", () => {
    expect(() =>
      createReviewSchema.parse({ deckId: UUID, rating: 6 })
    ).toThrow();
  });

  test("rejects comment longer than 1000 characters", () => {
    expect(() =>
      createReviewSchema.parse({
        deckId: UUID,
        rating: 5,
        comment: "a".repeat(1001),
      })
    ).toThrow("1000");
  });
});

describe("listDeckSchema", () => {
  test("accepts valid input", () => {
    const result = listDeckSchema.parse({ deckId: UUID, price: 499 });
    expect(result.price).toBe(499);
  });

  test("rejects negative price", () => {
    expect(() =>
      listDeckSchema.parse({ deckId: UUID, price: -1 })
    ).toThrow("negative");
  });

  test("rejects price above 9999", () => {
    expect(() =>
      listDeckSchema.parse({ deckId: UUID, price: 10000 })
    ).toThrow("99.99");
  });

  test("accepts free listing (price = 0)", () => {
    expect(() =>
      listDeckSchema.parse({ deckId: UUID, price: 0 })
    ).not.toThrow();
  });

  test("rejects non-integer price", () => {
    expect(() =>
      listDeckSchema.parse({ deckId: UUID, price: 4.99 })
    ).toThrow();
  });
});

describe("unlistDeckSchema", () => {
  test("accepts valid deckId", () => {
    expect(unlistDeckSchema.parse({ deckId: UUID }).deckId).toBe(UUID);
  });

  test("rejects invalid deckId", () => {
    expect(() => unlistDeckSchema.parse({ deckId: "bad" })).toThrow();
  });
});
