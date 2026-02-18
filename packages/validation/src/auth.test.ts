import { describe, test, expect } from "bun:test";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  updatePreferencesSchema,
} from "./auth";

describe("registerSchema", () => {
  const valid = {
    email: "test@example.com",
    password: "Password1",
    displayName: "Test User",
  };

  test("accepts valid input", () => {
    expect(registerSchema.parse(valid)).toMatchObject({
      email: "test@example.com",
      password: "Password1",
      displayName: "Test User",
    });
  });

  test("lowercases email", () => {
    const result = registerSchema.parse({
      ...valid,
      email: "Test@Example.COM",
    });
    expect(result.email).toBe("test@example.com");
  });

  test("trims display name", () => {
    const result = registerSchema.parse({
      ...valid,
      displayName: "  Test User  ",
    });
    expect(result.displayName).toBe("Test User");
  });

  test("rejects invalid email", () => {
    expect(() =>
      registerSchema.parse({ ...valid, email: "not-an-email" })
    ).toThrow();
  });

  test("rejects missing email", () => {
    const { email, ...rest } = valid;
    expect(() => registerSchema.parse(rest)).toThrow();
  });

  test("rejects password shorter than 8 characters", () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: "Pass1" })
    ).toThrow("at least 8");
  });

  test("rejects password longer than 128 characters", () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: "A1" + "a".repeat(127) })
    ).toThrow("at most 128");
  });

  test("rejects password without uppercase letter", () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: "password1" })
    ).toThrow();
  });

  test("rejects password without lowercase letter", () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: "PASSWORD1" })
    ).toThrow();
  });

  test("rejects password without digit", () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: "Passwordd" })
    ).toThrow();
  });

  test("rejects display name shorter than 2 characters", () => {
    expect(() =>
      registerSchema.parse({ ...valid, displayName: "A" })
    ).toThrow("at least 2");
  });

  test("rejects display name longer than 50 characters", () => {
    expect(() =>
      registerSchema.parse({ ...valid, displayName: "A".repeat(51) })
    ).toThrow("at most 50");
  });

  test("accepts password at exactly 8 characters", () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: "Abcdef1x" })
    ).not.toThrow();
  });

  test("rejects email longer than 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    expect(() =>
      registerSchema.parse({ ...valid, email: longEmail })
    ).toThrow();
  });
});

describe("loginSchema", () => {
  test("accepts valid input", () => {
    const result = loginSchema.parse({
      email: "test@example.com",
      password: "anything",
    });
    expect(result.email).toBe("test@example.com");
  });

  test("lowercases email", () => {
    const result = loginSchema.parse({
      email: "Test@EXAMPLE.com",
      password: "pass",
    });
    expect(result.email).toBe("test@example.com");
  });

  test("rejects empty password", () => {
    expect(() =>
      loginSchema.parse({ email: "test@example.com", password: "" })
    ).toThrow("required");
  });

  test("rejects missing email", () => {
    expect(() => loginSchema.parse({ password: "pass" })).toThrow();
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "oldpass",
    newPassword: "NewPass1x",
    confirmPassword: "NewPass1x",
  };

  test("accepts valid input", () => {
    expect(() => changePasswordSchema.parse(valid)).not.toThrow();
  });

  test("rejects empty current password", () => {
    expect(() =>
      changePasswordSchema.parse({ ...valid, currentPassword: "" })
    ).toThrow("required");
  });

  test("rejects weak new password", () => {
    expect(() =>
      changePasswordSchema.parse({
        ...valid,
        newPassword: "weak",
        confirmPassword: "weak",
      })
    ).toThrow();
  });

  test("rejects mismatched passwords", () => {
    expect(() =>
      changePasswordSchema.parse({
        ...valid,
        confirmPassword: "Different1x",
      })
    ).toThrow("do not match");
  });

  test("validates new password complexity", () => {
    expect(() =>
      changePasswordSchema.parse({
        ...valid,
        newPassword: "nouppercase1",
        confirmPassword: "nouppercase1",
      })
    ).toThrow();
  });
});

describe("updateProfileSchema", () => {
  test("accepts empty object (all optional)", () => {
    expect(() => updateProfileSchema.parse({})).not.toThrow();
  });

  test("accepts valid display name", () => {
    const result = updateProfileSchema.parse({ displayName: "New Name" });
    expect(result.displayName).toBe("New Name");
  });

  test("rejects short display name", () => {
    expect(() =>
      updateProfileSchema.parse({ displayName: "A" })
    ).toThrow("at least 2");
  });

  test("accepts valid avatar URL", () => {
    expect(() =>
      updateProfileSchema.parse({ avatarUrl: "https://example.com/avatar.png" })
    ).not.toThrow();
  });

  test("accepts null avatar URL", () => {
    const result = updateProfileSchema.parse({ avatarUrl: null });
    expect(result.avatarUrl).toBeNull();
  });

  test("rejects invalid avatar URL", () => {
    expect(() =>
      updateProfileSchema.parse({ avatarUrl: "not-a-url" })
    ).toThrow();
  });
});

describe("updatePreferencesSchema", () => {
  test("accepts empty object", () => {
    expect(() => updatePreferencesSchema.parse({})).not.toThrow();
  });

  test("accepts all valid fields", () => {
    const result = updatePreferencesSchema.parse({
      darkMode: true,
      themeColor: "blue",
      dailyGoal: 50,
      reminderTimes: ["09:00", "18:00"],
      cardSortingLogic: "due_first",
      cardTheme: "minimal",
      pushAlerts: false,
      favoriteDeckIds: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.darkMode).toBe(true);
    expect(result.dailyGoal).toBe(50);
  });

  test("rejects dailyGoal below 1", () => {
    expect(() =>
      updatePreferencesSchema.parse({ dailyGoal: 0 })
    ).toThrow();
  });

  test("rejects dailyGoal above 500", () => {
    expect(() =>
      updatePreferencesSchema.parse({ dailyGoal: 501 })
    ).toThrow();
  });

  test("accepts dailyGoal boundary values", () => {
    expect(() => updatePreferencesSchema.parse({ dailyGoal: 1 })).not.toThrow();
    expect(() => updatePreferencesSchema.parse({ dailyGoal: 500 })).not.toThrow();
  });

  test("rejects invalid cardSortingLogic", () => {
    expect(() =>
      updatePreferencesSchema.parse({ cardSortingLogic: "alphabetical" })
    ).toThrow();
  });

  test("accepts all cardSortingLogic values", () => {
    for (const value of ["due_first", "random", "difficulty"]) {
      expect(() =>
        updatePreferencesSchema.parse({ cardSortingLogic: value })
      ).not.toThrow();
    }
  });

  test("rejects more than 5 reminder times", () => {
    expect(() =>
      updatePreferencesSchema.parse({
        reminderTimes: ["1", "2", "3", "4", "5", "6"],
      })
    ).toThrow();
  });

  test("rejects invalid UUIDs in favoriteDeckIds", () => {
    expect(() =>
      updatePreferencesSchema.parse({ favoriteDeckIds: ["not-a-uuid"] })
    ).toThrow();
  });

  test("rejects more than 100 favoriteDeckIds", () => {
    const ids = Array.from({ length: 101 }, () =>
      "550e8400-e29b-41d4-a716-446655440000"
    );
    expect(() =>
      updatePreferencesSchema.parse({ favoriteDeckIds: ids })
    ).toThrow();
  });
});
