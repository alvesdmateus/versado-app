import { apiClient } from "./api-client";

export interface GeneratedCard {
  front: string;
  back: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

export const aiApi = {
  generate(params: { deckId: string; prompt: string; count: number }) {
    return apiClient<{ cards: GeneratedCard[] }>("/api/ai/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  getUsage() {
    return apiClient<{ used: number; limit: number }>("/api/ai/usage");
  },
};
