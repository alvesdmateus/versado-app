import type { AuthResponse, RefreshResponse, PublicProfile } from "@flashcard/auth";
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
};
