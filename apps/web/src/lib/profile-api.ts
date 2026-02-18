import type { PublicProfile } from "@versado/auth";
import { apiClient } from "./api-client";

export interface UserPreferences {
  darkMode: boolean;
  themeColor: string;
  dailyGoal: number;
  reminderTimes: string[];
  cardSortingLogic: "due_first" | "random" | "difficulty";
  cardTheme: string;
  pushAlerts: boolean;
  favoriteDeckIds: string[];
}

export const profileApi = {
  update(data: { displayName?: string; avatarUrl?: string | null }) {
    return apiClient<PublicProfile>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return apiClient<{ success: boolean }>("/api/profile/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPreferences() {
    return apiClient<UserPreferences>("/api/profile/preferences");
  },

  updatePreferences(data: Partial<UserPreferences>) {
    return apiClient<UserPreferences>("/api/profile/preferences", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
