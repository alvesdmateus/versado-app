import type { AuthResponse, RefreshResponse, PublicProfile } from "@versado/auth";
import { apiClient } from "./api-client";

let inFlightRefresh: Promise<RefreshResponse> | null = null;

export const authApi = {
  login(email: string, password: string) {
    return apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string, displayName: string, acceptedTerms: true, turnstileToken?: string) {
    return apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName, acceptedTerms, turnstileToken }),
    });
  },

  // Refresh tokens rotate on every use, so concurrent calls (StrictMode double
  // effects, timer + refreshUser) must share one request; a second request would
  // present the already-rotated token, get 401 and log the user out.
  refresh() {
    inFlightRefresh ??= apiClient<RefreshResponse>("/auth/refresh", {
      method: "POST",
    }).finally(() => {
      inFlightRefresh = null;
    });
    return inFlightRefresh;
  },

  logout() {
    return apiClient<{ success: boolean }>("/auth/logout", {
      method: "POST",
    });
  },

  getMe() {
    return apiClient<PublicProfile>("/auth/me");
  },

  forgotPassword(email: string, turnstileToken?: string) {
    return apiClient<{ success: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, turnstileToken }),
    });
  },

  resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return apiClient<{ success: boolean }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
  },

  verifyEmail(token: string) {
    return apiClient<{ success: boolean }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },

  resendVerification(email: string) {
    return apiClient<{ success: boolean }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  getGoogleAuthUrl() {
    return apiClient<{ url: string }>("/auth/google");
  },
};
