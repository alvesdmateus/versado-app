import { describe, test, expect } from "bun:test";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  BCRYPT_ROUNDS,
  REFRESH_TOKEN_COOKIE,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION,
} from "./constants";

describe("auth constants", () => {
  test("ACCESS_TOKEN_EXPIRY is 15 minutes in seconds", () => {
    expect(ACCESS_TOKEN_EXPIRY).toBe(900);
    expect(ACCESS_TOKEN_EXPIRY).toBe(15 * 60);
  });

  test("REFRESH_TOKEN_EXPIRY is 7 days in seconds", () => {
    expect(REFRESH_TOKEN_EXPIRY).toBe(604800);
    expect(REFRESH_TOKEN_EXPIRY).toBe(7 * 24 * 60 * 60);
  });

  test("BCRYPT_ROUNDS is at least 10 for security", () => {
    expect(BCRYPT_ROUNDS).toBeGreaterThanOrEqual(10);
  });

  test("BCRYPT_ROUNDS is at most 15 for performance", () => {
    expect(BCRYPT_ROUNDS).toBeLessThanOrEqual(15);
  });

  test("REFRESH_TOKEN_COOKIE is a non-empty string", () => {
    expect(typeof REFRESH_TOKEN_COOKIE).toBe("string");
    expect(REFRESH_TOKEN_COOKIE.length).toBeGreaterThan(0);
  });

  test("MAX_LOGIN_ATTEMPTS is reasonable (5-20)", () => {
    expect(MAX_LOGIN_ATTEMPTS).toBeGreaterThanOrEqual(5);
    expect(MAX_LOGIN_ATTEMPTS).toBeLessThanOrEqual(20);
  });

  test("LOCKOUT_DURATION is at least 5 minutes", () => {
    expect(LOCKOUT_DURATION).toBeGreaterThanOrEqual(5 * 60);
  });

  test("LOCKOUT_DURATION is at most 1 hour", () => {
    expect(LOCKOUT_DURATION).toBeLessThanOrEqual(60 * 60);
  });
});
