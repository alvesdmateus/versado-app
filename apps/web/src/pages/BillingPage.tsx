import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
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

export function BillingPage() {
  const { t } = useTranslation("billing");
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Handle post-checkout redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      refreshUser();
      showToast(t("successWelcome"));
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      showToast(t("checkoutCanceled"), "info");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshUser, showToast]);

  // Fetch subscription for fluent users
  useEffect(() => {
    if (user?.tier === "fluent") {
      billingApi
        .getSubscription()
        .then(({ subscription }) => setSubscription(subscription))
        .catch((err) => showErrorNotification(err))
        .finally(() => setSubLoading(false));
    } else {
      setSubLoading(false);
    }
  }, [user?.tier]);

  async function handleCancel() {
    setIsCanceling(true);
    try {
      await billingApi.cancelSubscription();
      setSubscription((prev) =>
        prev ? { ...prev, cancelAtPeriodEnd: true } : prev
      );
      showToast(t("canceledAtEnd"), "info");
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
      showToast(t("subscriptionResumed"));
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

  const isFluent = user?.tier === "fluent";

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-neutral-900">
          {isFluent ? t("yourPlan") : t("heroTitle")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isFluent
            ? t("manageSubtitle")
            : t("heroSubtitle")}
        </p>
      </div>

      {isFluent && subscription && !subLoading ? (
        /* Fluent user — subscription management */
        <div className="px-5 space-y-4">
          {/* Current plan card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">{t("fluentPlanName")}</h3>
              <span
                className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  subscription.cancelAtPeriodEnd
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white/20 text-white"
                }`}
              >
                {subscription.cancelAtPeriodEnd ? t("canceling") : t("active")}
              </span>
            </div>
            <p className="mt-1 text-sm text-primary-100">
              {subscription.cancelAtPeriodEnd
                ? t("accessUntil", { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })
                : t("nextBilling", { date: new Date(subscription.currentPeriodEnd).toLocaleDateString() })}
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
                {t("manageBilling")}
              </span>
              <ExternalLink className="h-4 w-4 text-neutral-400" />
            </button>
            <div className="flex w-full items-center gap-3 p-4">
              <Calendar className="h-5 w-5 text-neutral-500" />
              <span className="flex-1 text-sm text-neutral-700">
                {t("billingPeriodEnds")}
              </span>
              <span className="text-sm text-neutral-500">
                {new Date(
                  subscription.currentPeriodEnd
                ).toLocaleDateString()}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd ? (
              <button
                onClick={handleResume}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-50"
              >
                <Sparkles className="h-5 w-5 text-primary-500" />
                <span className="flex-1 text-sm font-medium text-primary-600">
                  {t("resumeSubscription")}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsCancelOpen(true)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-50"
              >
                <X className="h-5 w-5 text-error-500" />
                <span className="flex-1 text-sm font-medium text-error-600">
                  {t("cancelSubscription")}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : !isFluent ? (
        /* Free user — Stripe Pricing Table */
        <div className="px-5">
          {/* @ts-expect-error Stripe Pricing Table web component */}
          <stripe-pricing-table
            pricing-table-id="prctbl_1T6x2Z4ZISSLoYxJtj9R7Vmo"
            publishable-key="pk_live_51T1o8y4ZISSLoYxJfKtqR2AYZVuuXHMcfCagGbRT4ylFfYg8g9j85Z9ASdoyxIr7gsVdYk1IlEaO9c1ooC99ztO2005mgVKGdv"
            client-reference-id={user?.id}
            customer-email={user?.email}
          />
        </div>
      ) : null}

      {/* Cancel confirmation */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title={t("cancelDialogTitle")}
        message={t("cancelDialogMessage")}
        confirmLabel={t("cancelSubscription")}
        variant="danger"
        isLoading={isCanceling}
      />
    </div>
  );
}
