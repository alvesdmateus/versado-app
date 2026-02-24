import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Calendar,
  ExternalLink,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { SettingsSection } from "./SettingsSection";
import { SettingRow } from "./SettingRow";
import { billingApi, type Subscription } from "@/lib/billing-api";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { ConfirmDialog } from "@/components/shared";

export function SubscriptionSection() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    billingApi
      .getSubscription()
      .then(({ subscription }) => setSubscription(subscription))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !subscription) return null;

  async function handleManageBilling() {
    try {
      const { url } = await billingApi.createPortalSession();
      window.location.href = url;
    } catch (err) {
      showErrorNotification(err, { onRetry: handleManageBilling });
    }
  }

  async function handleCancel() {
    setIsCanceling(true);
    try {
      await billingApi.cancelSubscription();
      setSubscription((prev) =>
        prev ? { ...prev, cancelAtPeriodEnd: true } : prev
      );
      showToast(t("profile.cancelMessage"), "info");
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

  return (
    <>
      <SettingsSection label={t("profile.subscription")}>
        <SettingRow
          icon={<CreditCard className="h-5 w-5" />}
          label={t("profile.currentPlan")}
          value={t("billing.fluent")}
        />
        <SettingRow
          icon={<Calendar className="h-5 w-5" />}
          label={
            subscription.cancelAtPeriodEnd
              ? t("profile.accessUntil")
              : t("profile.nextBilling")
          }
          value={new Date(
            subscription.currentPeriodEnd
          ).toLocaleDateString()}
        />
        <SettingRow
          icon={<ExternalLink className="h-5 w-5" />}
          label={t("profile.manageBilling")}
          onClick={handleManageBilling}
        />
        {subscription.cancelAtPeriodEnd ? (
          <SettingRow
            icon={<RefreshCw className="h-5 w-5" />}
            label={t("profile.resumeSubscription")}
            onClick={handleResume}
          />
        ) : (
          <SettingRow
            icon={<XCircle className="h-5 w-5" />}
            label={t("profile.cancelSubscription")}
            danger
            onClick={() => setIsCancelOpen(true)}
          />
        )}
      </SettingsSection>

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
    </>
  );
}
