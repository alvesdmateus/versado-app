import { apiClient } from "./api-client";

export const onboardingApi = {
  claimStarterDecks(tags: string[]) {
    return apiClient<{ claimedDeckIds: string[] }>(
      "/api/onboarding/claim-starter-decks",
      {
        method: "POST",
        body: JSON.stringify({ tags }),
      },
    );
  },
};
