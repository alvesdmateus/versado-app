import { apiClient } from "./api-client";

export const blocksApi = {
  blockUser(userId: string) {
    return apiClient<{ success: boolean }>(`/api/blocks/${userId}`, {
      method: "POST",
    });
  },
  unblockUser(userId: string) {
    return apiClient<{ success: boolean }>(`/api/blocks/${userId}`, {
      method: "DELETE",
    });
  },
  getBlocked() {
    return apiClient<{ blockedUserIds: string[] }>("/api/blocks");
  },
};
