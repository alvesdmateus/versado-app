import { apiClient } from "./api-client";

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export const billingApi = {
  createCheckout(priceId: string) {
    return apiClient<{ url: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId }),
    });
  },

  getSubscription() {
    return apiClient<{ subscription: Subscription | null }>(
      "/api/billing/subscription"
    );
  },

  cancelSubscription() {
    return apiClient<{ success: boolean }>("/api/billing/cancel", {
      method: "POST",
    });
  },

  resumeSubscription() {
    return apiClient<{ success: boolean }>("/api/billing/resume", {
      method: "POST",
    });
  },

  createPortalSession() {
    return apiClient<{ url: string }>("/api/billing/portal", {
      method: "POST",
    });
  },
};
