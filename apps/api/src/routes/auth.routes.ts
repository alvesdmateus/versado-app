import { Hono } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from "@versado/validation";
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

authRoutes.post(
  "/forgot-password",
  rateLimitMiddleware(3, 60_000),
  async (c) => {
    const body = await c.req.json();
    const { email } = validate(forgotPasswordSchema, body);
    await authService.forgotPassword(email);
    return c.json({ success: true });
  }
);

authRoutes.post("/reset-password", async (c) => {
  const body = await c.req.json();
  const { token, newPassword } = validate(resetPasswordSchema, body);
  await authService.resetPassword(token, newPassword);
  return c.json({ success: true });
});

authRoutes.post("/verify-email", async (c) => {
  const body = await c.req.json();
  const { token } = validate(verifyEmailSchema, body);
  await authService.verifyEmail(token);
  return c.json({ success: true });
});

authRoutes.post(
  "/resend-verification",
  rateLimitMiddleware(3, 60_000),
  async (c) => {
    const body = await c.req.json();
    const { email } = validate(resendVerificationSchema, body);
    await authService.resendVerificationEmail(email);
    return c.json({ success: true });
  }
);

// Get current user profile (protected)
authRoutes.get("/me", authMiddleware(), async (c) => {
  const user = c.get("user");
  const profile = await authService.getUserProfile(user.id);
  if (!profile) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return c.json(profile);
});
