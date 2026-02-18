import { describe, test, expect } from "bun:test";
import { createCheckoutSchema } from "./billing";

describe("createCheckoutSchema", () => {
  test("accepts valid price ID", () => {
    const result = createCheckoutSchema.parse({
      priceId: "price_1234567890",
    });
    expect(result.priceId).toBe("price_1234567890");
  });

  test("rejects priceId not starting with price_", () => {
    expect(() =>
      createCheckoutSchema.parse({ priceId: "prod_1234" })
    ).toThrow("Invalid price ID");
  });

  test("rejects empty priceId", () => {
    expect(() => createCheckoutSchema.parse({ priceId: "" })).toThrow();
  });

  test("rejects missing priceId", () => {
    expect(() => createCheckoutSchema.parse({})).toThrow();
  });
});
