import { apiClient } from "./api-client";

export interface DashboardStats {
  mastered: number;
  dueToday: number;
  accuracy: number;
  streakDays: number;
  streakActive: boolean;
  decks: Array<{
    id: string;
    name: string;
    cardCount: number;
    coverImageUrl: string | null;
    progress: number;
  }>;
}

export const dashboardApi = {
  getStats() {
    return apiClient<DashboardStats>("/api/dashboard");
  },
};
