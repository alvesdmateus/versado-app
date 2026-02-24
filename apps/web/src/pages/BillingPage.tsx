import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
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
import { billingApi, type Subscription, type Price } from "@/lib/billing-api";
import { ConfirmDialog } from "@/components/shared";
import { Button } from "@versado/ui";

const LOCALE_CURRENCY_MAP: Record<string, string> = {
  "pt-BR": "brl",
  "en-US": "usd",
  "en-GB": "gbp",
  "es-MX": "mxn",
  "es-AR": "ars",
  "ja-JP": "jpy",
  "en-AU": "aud",
  "en-CA": "cad",
  "de-DE": "eur",
  "fr-FR": "eur",
  "es-ES": "eur",
  "it-IT": "eur",
};

function getCurrencyFromLocale(): string {
  const locale = navigator.language;
  return LOCALE_CURRENCY_MAP[locale] ?? "usd";
}

function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(unitAmount / 100);
}

export function BillingPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [prices, setPrices] = useState<Price[]>([]);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  const FREE_FEATURES = [
    { label: t("billing.features_free_1"), included: true },
    { label: t("billing.features_free_2"), included: true },
    { label: t("billing.features_free_3"), included: true },
    { label: t("billing.features_free_4"), included: true },
    { label: t("billing.features_free_5"), included: true },
    { label: t("billing.features_free_6"), included: true },
    { label: t("billing.features_free_7"), included: true },
    { label: t("billing.features_fluent_1"), included: false },
    { label: t("billing.features_fluent_2"), included: false },
    { label: t("billing.features_fluent_7"), included: false },
    { label: t("billing.features_fluent_9"), included: false },
  ];

  const FLUENT_FEATURES = [
    { label: t("billing.features_fluent_1"), included: true },
    { label: t("billing.features_fluent_2"), included: true },
    { label: t("billing.features_fluent_3"), included: true },
    { label: t("billing.features_fluent_4"), included: true },
    { label: t("billing.features_fluent_5"), included: true },
    { label: t("billing.features_fluent_6"), included: true },
    { label: t("billing.features_fluent_7"), included: true },
    { label: t("billing.features_fluent_8"), included: true },
    { label: t("billing.features_fluent_9"), included: true },
    { label: t("billing.features_fluent_10"), included: true },
  ];

  const userCurrency = useMemo(() => getCurrencyFromLocale(), []);

  const selectedPrice = useMemo(() => {
    const byUserCurrency = prices.filter((p) => p.currency === userCurrency);
    const pool = byUserCurrency.length > 0 ? byUserCurrency : prices.filter((p) => p.currency === "usd");
    return pool.find((p) => p.recurring?.interval === billingInterval) ?? pool[0] ?? null;
  }, [prices, userCurrency, billingInterval]);

  const hasMultipleIntervals = useMemo(() => {
    const byUserCurrency = prices.filter((p) => p.currency === userCurrency);
    const pool = byUserCurrency.length > 0 ? byUserCurrency : prices.filter((p) => p.currency === "usd");
    const intervals = new Set(pool.map((p) => p.recurring?.interval).filter(Boolean));
    return intervals.size > 1;
  }, [prices, userCurrency]);

  // Handle post-checkout redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      refreshUser();
      showToast(t("billing.success"));
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("canceled") === "true") {
      showToast(t("billing.canceled"), "info");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshUser, showToast, t]);

  // Fetch subscription or prices
  useEffect(() => {
    if (user?.tier === "fluent") {
      billingApi
        .getSubscription()
        .then(({ subscription }) => setSubscription(subscription))
        .catch(() => {})
        .finally(() => setSubLoading(false));
    } else {
      billingApi
        .getPrices()
        .then(({ prices }) => setPrices(prices))
        .catch(() => {})
        .finally(() => setSubLoading(false));
    }
  }, [user?.tier]);

  async function handleUpgrade() {
    if (!selectedPrice) return;
    setIsLoading(true);
    try {
      const { url } = await billingApi.createCheckout(selectedPrice.id);
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
        t("profile.cancelMessage"),
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
      showToast(t("profile.resumeSubscription"));
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
          {isFluent ? t("billing.yourPlan") : t("billing.fromCuriousToFluent")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {isFluent
            ? t("billing.manageSubscription")
            : t("billing.unlockPotential")}
        </p>
      </div>

      {isFluent && subscription && !subLoading ? (
        /* Fluent user — subscription management */
        <div className="px-5 space-y-4">
          {/* Current plan card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-white" />
              <h3 className="text-lg font-bold text-white">{t("billing.fluent")}</h3>
              <span
                className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  subscription.cancelAtPeriodEnd
                    ? "bg-amber-100 text-amber-700"
                    : "bg-white/20 text-white"
                }`}
              >
                {subscription.cancelAtPeriodEnd
                  ? t("profile.subscriptionCanceling")
                  : t("profile.subscriptionActive")}
              </span>
            </div>
            <p className="mt-1 text-sm text-primary-100">
              {subscription.cancelAtPeriodEnd
                ? `${t("profile.accessUntil")} ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : `${t("profile.nextBilling")} ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
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
                {t("billing.managePageBilling")}
              </span>
              <ExternalLink className="h-4 w-4 text-neutral-400" />
            </button>
            <button
              onClick={() => {}}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <Calendar className="h-5 w-5 text-neutral-500" />
              <span className="flex-1 text-sm text-neutral-700">
                {t("billing.billingPeriodEnds")}
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
                  {t("profile.resumeSubscription")}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsCancelOpen(true)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-50"
              >
                <X className="h-5 w-5 text-error-500" />
                <span className="flex-1 text-sm font-medium text-error-600">
                  {t("profile.cancelSubscription")}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : !isFluent ? (
        /* Free user — pricing comparison */
        <div className="px-5 space-y-4">
          {/* Free plan */}
          <div className="rounded-xl border-2 border-neutral-200 bg-neutral-0 p-5">
            <h3 className="text-base font-semibold text-neutral-700">{t("billing.free")}</h3>
            <p className="mt-1 text-2xl font-bold text-neutral-900">
              $0
              <span className="text-sm font-normal text-neutral-500">
                /{t("billing.monthly").toLowerCase()}
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
                {t("billing.freeDesc")}
              </Button>
            </div>
          </div>

          {/* Fluent plan */}
          <div className="rounded-xl border-2 border-primary-500 bg-neutral-0 p-5 shadow-card">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-700">
                {t("billing.fluent")}
              </h3>
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                {t("billing.fluentDesc")}
              </span>
            </div>
            {selectedPrice && (
              <p className="mt-1 text-2xl font-bold text-neutral-900">
                {formatPrice(selectedPrice.unitAmount, selectedPrice.currency)}
                <span className="text-sm font-normal text-neutral-500">
                  /{selectedPrice.recurring?.interval === "year" ? t("billing.yearly").toLowerCase() : t("billing.monthly").toLowerCase()}
                </span>
              </p>
            )}
            {hasMultipleIntervals && (
              <div className="mt-3 flex rounded-lg bg-neutral-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setBillingInterval("month")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    billingInterval === "month"
                      ? "bg-neutral-0 text-neutral-900 shadow-sm"
                      : "text-neutral-500"
                  }`}
                >
                  {t("billing.monthly")}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("year")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    billingInterval === "year"
                      ? "bg-neutral-0 text-neutral-900 shadow-sm"
                      : "text-neutral-500"
                  }`}
                >
                  {t("billing.yearly")}
                </button>
              </div>
            )}
            <div className="mt-4 space-y-2.5">
              {FLUENT_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-500" />
                  <span className="text-sm text-neutral-700">{f.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button fullWidth onClick={handleUpgrade} disabled={isLoading || !selectedPrice}>
                {isLoading ? t("billing.redirecting") : t("billing.goFluent")}
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
        title={t("profile.cancelTitle")}
        message={t("profile.cancelMessage")}
        confirmLabel={t("profile.cancelConfirm")}
        variant="danger"
        isLoading={isCanceling}
      />
    </div>
  );
}
