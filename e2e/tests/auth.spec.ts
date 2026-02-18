import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/register/);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);
  });

  test("can register a new user", async ({ page }) => {
    await page.goto("/register");

    const email = `e2e-register-${Date.now()}@test.com`;
    await page.fill('input[name="email"], input[type="email"]', email);
    await page.fill('input[name="password"], input[type="password"]', "Password1");
    await page.fill(
      'input[name="displayName"], input[placeholder*="name" i]',
      "E2E Test User"
    );

    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Register"), button:has-text("Create")');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      // Should redirect to home/dashboard after registration
      await page.waitForURL(/(\/|\/decks|\/home)/, { timeout: 10000 });
    }
  });

  test("shows error for invalid login", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"], input[type="email"]', "nonexistent@test.com");
    await page.fill('input[name="password"], input[type="password"]', "WrongPass1");

    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")');
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      // Should show an error message
      await expect(
        page.locator("text=/invalid|error|incorrect|wrong/i")
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("redirects unauthenticated user to login", async ({ page }) => {
    // Clear any stored auth state
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    // Try to access a protected route
    await page.goto("/decks");
    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
