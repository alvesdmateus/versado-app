import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  Check,
  X,
  Sparkles,
  CreditCard,
  Calendar,
  ExternalLink,
  Crown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { billingApi, type Subscription } from "@/lib/billing-api";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@flashcard/ui";

const PREMIUM_MONTHLY_PRICE_ID = import.meta.env
  .VITE_STRIPE_PRICE_ID_PREMIUM_MONTHLY as string;

const FREE_FEATURES = [
  { label: "Up to 5 decks", included: true },
  { label: "100 cards per deck", included: true },
  { label: "SM-2 spaced repetition", included: true },
  { label: "Basic study stats", included: true },
  { label: "Marketplace browsing", included: true },
  { label: "Unlimited decks", included: false },
  { label: "Unlimited cards", included: false },
  { label: "AI card generation", included: false },
  { label: "Sell decks on marketplace", included: false },
];

const PREMIUM_FEATURES = [
  { label: "Unlimited decks", included: true },
  { label: "Unlimited cards", included: true },
  { label: "SM-2 spaced repetition", included: true },
  { label: "Advanced study analytics", included: true },
  { label: "Marketplace browsing", included: true },
  { label: "AI card generation", included: true },
  { label: "Sell decks on marketplace", included: true },
  { label: "Priority support", included: true },
];

export function BillingPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Handle post-checkout redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      refreshUser();
      showToast("Welcome to Premium! Your account has been upgraded.");
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      showToast("Checkout canceled", "info");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshUser, showToast]);

  // Fetch subscription
  useEffect(() => {
    if (user?.tier === "premium") {
      billingApi
        .getSubscription()
        .then(({ subscription }) => setSubscription(subscription))
        .catch(() => {})
        .finally(() => setSubLoading(false));
    } else {
      setSubLoading(false);
    }
  }, [user?.tier]);

  async function handleUpgrade() {
    setIsLoading(true);
    try {
      const { url } = await billingApi.createCheckout(PREMIUM_MONTHLY_PRICE_ID);
      window.location.href = url;
    } catch (err) {
      showErrorNotification(err, { onRetry: handleUpgrade });
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    setIsCanceling(true);
    try {
      await billingApi.cancelSubscription();
      setSubscription((prev) =>
        prev ? { ...prev, cancelAtPeriodEnd: true } : prev
      );
      showToast(
        "Subscription will be canceled at end of billing period",
        "info"
      );
    } catch (err) {
      showErrorNotification(err, { onRetry: handleCancel });
    } finally {
      setIsCanceling(false);
      setIsCancelOpen(false);
    }
  }

  async function handleResume() {
    try {
      await billingApi.resumeSubscription();
      setSubscription((prev) =>
        prev ? { ...prev, cancelAtPeriodEnd: false } : prev
      );
      showToast("Subscription resumed!");
    } catch (err) {
      showErrorNotification(err, { onRetry: handleResume });
    }
  }

  async function handleManageBilling() {
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url;
    } catch (err) {
      showErrorNotification(err, { onRetry: handleManageBilling });
    }
  }

  const isPremium = user?.tier === "premium";

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-neutral-900">
          {isPremium ? "Your Plan" : "Upgrade to Premium"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isPremium
            ? "Manage your subscription and billing"
            : "Unlock the full potential of your study experience"}
        </p>
      </div>

      {isPremium && subscription && !subLoading ? (
        /* Premium user — subscription management */
        <div className="px-5 space-y-4">
          {/* Current plan card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">Premium Plan</h3>
              <span
                className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  subscription.cancelAtPeriodEnd
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white/20 text-white"
                }`}
              >
                {subscription.cancelAtPeriodEnd ? "Canceling" : "Active"}
              </span>
            </div>
            <p className="mt-1 text-sm text-primary-100">
              {subscription.cancelAtPeriodEnd
                ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : `Next billing: ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
            </p>
          </div>

          {/* Management actions */}
          <div className="rounded-xl bg-neutral-0 shadow-card divide-y divide-neutral-100">
            <button
              onClick={handleManageBilling}
              className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-50"
            >
              <CreditCard className="h-5 w-5 text-neutral-500" />
              <span className="flex-1 text-sm font-medium text-neutral-700">
                Manage Billing
              </span>
              <ExternalLink className="h-4 w-4 text-neutral-400" />
            </button>
            <button
              onClick={() => {}}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <Calendar className="h-5 w-5 text-neutral-500" />
              <span className="flex-1 text-sm text-neutral-700">
                Billing period ends
              </span>
              <span className="text-sm text-neutral-500">
                {new Date(
                  subscription.currentPeriodEnd
                ).toLocaleDateString()}
              </span>
            </button>
            {subscription.cancelAtPeriodEnd ? (
              <button
                onClick={handleResume}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-50"
              >
                <Sparkles className="h-5 w-5 text-primary-500" />
                <span className="flex-1 text-sm font-medium text-primary-600">
                  Resume Subscription
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsCancelOpen(true)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-50"
              >
                <X className="h-5 w-5 text-error-500" />
                <span className="flex-1 text-sm font-medium text-error-600">
                  Cancel Subscription
                </span>
              </button>
            )}
          </div>
        </div>
      ) : !isPremium ? (
        /* Free user — pricing comparison */
        <div className="px-5 space-y-4">
          {/* Free plan */}
          <div className="rounded-xl border-2 border-neutral-200 bg-neutral-0 p-5">
            <h3 className="text-base font-semibold text-neutral-700">Free</h3>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              $0
              <span className="text-sm font-normal text-neutral-500">
                /month
              </span>
            </p>
            <div className="mt-4 space-y-2.5">
              {FREE_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  {f.included ? (
                    <Check className="h-4 w-4 text-success-500" />
                  ) : (
                    <X className="h-4 w-4 text-neutral-300" />
                  )}
                  <span
                    className={`text-sm ${f.included ? "text-neutral-700" : "text-neutral-400"}`}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="secondary" fullWidth disabled>
                Current Plan
              </Button>
            </div>
          </div>

          {/* Premium plan */}
          <div className="rounded-xl border-2 border-primary-500 bg-neutral-0 p-5 shadow-card">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-700">
                Premium
              </h3>
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                Recommended
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              $9.99
              <span className="text-sm font-normal text-neutral-500">
                /month
              </span>
            </p>
            <div className="mt-4 space-y-2.5">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-500" />
                  <span className="text-sm text-neutral-700">{f.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button fullWidth onClick={handleUpgrade} disabled={isLoading}>
                {isLoading ? "Redirecting..." : "Upgrade to Premium"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel confirmation */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Subscription"
        message="Your premium features will remain active until the end of your current billing period. You can resume anytime before then."
        confirmLabel="Cancel Subscription"
        variant="danger"
        isLoading={isCanceling}
      />
    </div>
  );
}
