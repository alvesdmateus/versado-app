import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { X, Sparkles, Infinity, Zap, WifiOff } from "lucide-react";
import { Button } from "@versado/ui";
import { billingApi, type Price } from "@/lib/billing-api";
import { getCurrencyFromLocale, formatPrice } from "@/lib/currency";

interface GoFluentModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: "limit" | "session" | "feature";
}

const BENEFITS = [
  { icon: Infinity, key: "unlimitedReviews" },
  { icon: Zap, key: "unlimitedAI" },
  { icon: WifiOff, key: "offlineMode" },
] as const;

export function GoFluentModal({ isOpen, onClose, trigger = "session" }: GoFluentModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("billing");
  const [prices, setPrices] = useState<Price[]>([]);

  const userCurrency = useMemo(() => getCurrencyFromLocale(), []);

  const monthlyPrice = useMemo(() => {
    const byUserCurrency = prices.filter((p) => p.currency === userCurrency);
    const pool = byUserCurrency.length > 0 ? byUserCurrency : prices.filter((p) => p.currency === "usd");
    return pool.find((p) => p.recurring?.interval === "month") ?? pool[0] ?? null;
  }, [prices, userCurrency]);

  useEffect(() => {
    if (isOpen && prices.length === 0) {
      billingApi.getPrices().then(({ prices }) => setPrices(prices)).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const originalDisplay = monthlyPrice ? formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency) : null;
  const saleDisplay = monthlyPrice ? formatPrice(Math.round(monthlyPrice.unitAmount * 0.7), monthlyPrice.currency) : null;

  const subtitleKey = `goFluent.subtitle.${trigger}`;

  function handleGoFluent() {
    onClose();
    navigate("/billing?coupon=FIRST30");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-neutral-0 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Gradient hero */}
        <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {t("goFluent.headline")}
          </h2>
          <p className="mt-1 text-sm text-primary-100">
            {t(subtitleKey)}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-5">
          {/* Sale pricing */}
          {monthlyPrice && (
            <div className="mb-5 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 p-4 text-center">
              <span className="inline-block rounded-full bg-error-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {t("goFluent.saleTag")}
              </span>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="text-lg text-neutral-400 line-through">
                  {originalDisplay}
                </span>
                <span className="text-3xl font-bold text-neutral-900">
                  {saleDisplay}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                {t("goFluent.firstMonth")}
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="mb-5 space-y-3">
            {BENEFITS.map((b) => (
              <div key={b.key} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <b.icon className="h-4 w-4 text-primary-500" />
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {t(`goFluent.benefits.${b.key}`)}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button fullWidth onClick={handleGoFluent}>
            {saleDisplay
              ? t("goFluent.cta", { price: saleDisplay })
              : t("goFluent")}
          </Button>

          <button
            onClick={onClose}
            className="mt-2 w-full py-2 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
          >
            {t("goFluent.maybeLater")}
          </button>

          {/* Social proof */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              <div className="h-5 w-5 rounded-full bg-primary-200 ring-2 ring-neutral-0" />
              <div className="h-5 w-5 rounded-full bg-primary-300 ring-2 ring-neutral-0" />
              <div className="h-5 w-5 rounded-full bg-primary-400 ring-2 ring-neutral-0" />
            </div>
            <span className="text-xs text-neutral-500">
              {t("goFluent.socialProof")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
