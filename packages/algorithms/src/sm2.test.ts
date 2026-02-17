import { describe, expect, test } from "bun:test";
import { calculateSM2, getDefaultSM2State } from "./sm2";
import type { SM2Card } from "./types";

describe("SM-2 Algorithm", () => {
  describe("getDefaultSM2State", () => {
    test("returns correct defaults", () => {
      const state = getDefaultSM2State();
      expect(state.easeFactor).toBe(2.5);
      expect(state.interval).toBe(0);
      expect(state.repetitions).toBe(0);
    });
  });

  describe("calculateSM2", () => {
    describe("first review (new card)", () => {
      const newCard: SM2Card = getDefaultSM2State();

      test("Again (1) resets and sets interval to 1", () => {
        const result = calculateSM2(newCard, 1);
        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(1);
        expect(result.easeFactor).toBeLessThan(2.5);
      });

      test("Hard (2) advances to repetition 1 with interval 1", () => {
        const result = calculateSM2(newCard, 2);
        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
      });

      test("Good (3) advances to repetition 1 with interval 1", () => {
        const result = calculateSM2(newCard, 3);
        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
      });

      test("Easy (4) advances to repetition 1 with interval 1", () => {
        const result = calculateSM2(newCard, 4);
        expect(result.repetitions).toBe(1);
        expect(result.interval).toBe(1);
        expect(result.easeFactor).toBeGreaterThan(2.5);
      });
    });

    describe("second review (repetition 1)", () => {
      const cardAfterFirstReview: SM2Card = {
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      };

      test("Good (3) advances to interval 6", () => {
        const result = calculateSM2(cardAfterFirstReview, 3);
        expect(result.repetitions).toBe(2);
        expect(result.interval).toBe(6);
      });

      test("Again (1) resets to beginning", () => {
        const result = calculateSM2(cardAfterFirstReview, 1);
        expect(result.repetitions).toBe(0);
        expect(result.interval).toBe(1);
      });
    });

    describe("subsequent reviews (repetition 2+)", () => {
      const cardAfterSecondReview: SM2Card = {
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      };

      test("Good (3) multiplies interval by ease factor", () => {
        const result = calculateSM2(cardAfterSecondReview, 3);
        expect(result.repetitions).toBe(3);
        expect(result.interval).toBe(15); // 6 * 2.5 = 15
      });

      test("Easy (4) increases ease factor", () => {
        const result = calculateSM2(cardAfterSecondReview, 4);
        expect(result.easeFactor).toBeGreaterThan(2.5);
      });
    });

    describe("ease factor bounds", () => {
      test("ease factor never goes below 1.3", () => {
        const lowEaseCard: SM2Card = {
          easeFactor: 1.3,
          interval: 6,
          repetitions: 2,
        };
        const result = calculateSM2(lowEaseCard, 1);
        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      });
    });

    describe("next review date", () => {
      test("sets correct next review date based on interval", () => {
        const card: SM2Card = {
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
        };
        const result = calculateSM2(card, 3);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + result.interval);

        expect(result.nextReviewDate.toDateString()).toBe(
          expectedDate.toDateString()
        );
      });
    });
  });
});
