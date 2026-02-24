import type { AuthResponse, RefreshResponse, PublicProfile } from "@versado/auth";
import { apiClient } from "./api-client";

export const authApi = {
  login(email: string, password: string) {
    return apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(email: string, password: string, displayName: string) {
    return apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  refresh() {
    return apiClient<RefreshResponse>("/auth/refresh", {
      method: "POST",
    });
  },

  logout() {
    return apiClient<{ success: boolean }>("/auth/logout", {
      method: "POST",
    });
  },

  getMe() {
    return apiClient<PublicProfile>("/auth/me");
  },

  forgotPassword(email: string) {
    return apiClient<{ success: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
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
};
