import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { registerSchema, loginSchema } from "@versado/validation";
import { REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_EXPIRY } from "@versado/auth";
import { rateLimitMiddleware } from "../middleware/rate-limit";
import { authMiddleware } from "../middleware/auth";
import * as authService from "../services/auth-service";
import { AppError } from "../middleware/error-handler";
import { validate } from "../lib/validate";
import { env } from "../env";

export const authRoutes = new Hono();

// Stricter rate limiting for auth endpoints
authRoutes.use("*", rateLimitMiddleware(5, 60_000));

function setRefreshCookie(c: any, refreshToken: string) {
  setCookie(c, REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: REFRESH_TOKEN_EXPIRY,
    path: "/auth",
  });
}

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password, displayName } = validate(registerSchema, body);

  const { auth, refreshToken } = await authService.register(
    email,
    password,
    displayName
  );

  setRefreshCookie(c, refreshToken);
  return c.json(auth, 201);
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = validate(loginSchema, body);

  const { auth, refreshToken } = await authService.login(email, password);

  setRefreshCookie(c, refreshToken);
  return c.json(auth);
});

authRoutes.post("/refresh", async (c) => {
  const token = getCookie(c, REFRESH_TOKEN_COOKIE);
  if (!token) {
    throw new AppError(401, "No refresh token provided", "NO_REFRESH_TOKEN");
  }

  const { accessToken, refreshToken } = await authService.refresh(token);

  setRefreshCookie(c, refreshToken);
  return c.json({ accessToken });
});

authRoutes.post("/logout", async (c) => {
  const token = getCookie(c, REFRESH_TOKEN_COOKIE);
  if (token) {
    await authService.logout(token);
  }

  deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: "/auth" });
  return c.json({ success: true });
});

// Google OAuth
authRoutes.get("/google", (c) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError(501, "Google OAuth is not configured", "OAUTH_NOT_CONFIGURED");
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.API_URL}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 600,
    path: "/auth/google",
  });

  return c.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

authRoutes.get("/google/callback", async (c) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return c.redirect(`${env.WEB_URL}/auth/login?error=oauth_not_configured`);
  }

  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  const storedState = getCookie(c, "oauth_state");

  deleteCookie(c, "oauth_state", { path: "/auth/google" });

  if (error) {
    return c.redirect(`${env.WEB_URL}/auth/login?error=oauth_denied`);
  }

  if (!state || state !== storedState) {
    return c.redirect(`${env.WEB_URL}/auth/login?error=oauth_state_mismatch`);
  }

  if (!code) {
    return c.redirect(`${env.WEB_URL}/auth/login?error=oauth_no_code`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.API_URL}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return c.redirect(`${env.WEB_URL}/auth/login?error=oauth_token_failed`);
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // Fetch user profile from Google
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    if (!profileRes.ok) {
      return c.redirect(`${env.WEB_URL}/auth/login?error=oauth_profile_failed`);
    }

    const googleProfile = (await profileRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    const { auth, refreshToken } = await authService.findOrCreateGoogleUser(
      googleProfile.id,
      googleProfile.email,
      googleProfile.name,
      googleProfile.picture ?? null
    );

    setRefreshCookie(c, refreshToken);

    // Pass access token via URL fragment (not visible to server on redirect)
    return c.redirect(
      `${env.WEB_URL}/auth/callback#token=${auth.accessToken}`
    );
  } catch {
    return c.redirect(`${env.WEB_URL}/auth/login?error=oauth_failed`);
  }
});

// Get current user profile (protected)
authRoutes.get("/me", authMiddleware(), async (c) => {
  const user = c.get("user");
  const profile = await authService.getUserProfile(user.id);
  if (!profile) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return c.json(profile);
});
