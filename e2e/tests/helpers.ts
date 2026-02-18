import type { Page, APIRequestContext } from "@playwright/test";

const API_URL = "http://localhost:3000";

/**
 * Register a user via the API and return tokens.
 */
export async function registerUser(
  request: APIRequestContext,
  overrides?: { email?: string; password?: string; displayName?: string }
) {
  const email = overrides?.email ?? `e2e-${Date.now()}@test.com`;
  const password = overrides?.password ?? "Password1";
  const displayName = overrides?.displayName ?? "E2E User";

  const res = await request.post(`${API_URL}/auth/register`, {
    data: { email, password, displayName },
  });

  if (!res.ok()) {
    throw new Error(`Registration failed: ${res.status()} ${await res.text()}`);
  }

  const body = await res.json();
  return {
    accessToken: body.accessToken as string,
    user: body.user,
    email,
    password,
  };
}

/**
 * Login and inject auth state into the browser.
 */
export async function loginAndSetup(
  page: Page,
  request: APIRequestContext,
  credentials?: { email?: string; password?: string }
) {
  const user = await registerUser(request, credentials);

  // Navigate to app and inject token into localStorage
  await page.goto("/");
  await page.evaluate((token) => {
    localStorage.setItem("versado_access_token", token);
  }, user.accessToken);

  return user;
}

/**
 * Clean the test database via truncation.
 */
export async function cleanTestDatabase(request: APIRequestContext) {
  // Use a direct DB connection or admin endpoint in CI
  // For now, rely on unique email addresses per test
}
