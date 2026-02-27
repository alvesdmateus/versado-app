import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input } from "@versado/ui";
import { Modal } from "@/components/shared";
import { marketplaceApi } from "@/lib/marketplace-api";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";

interface ListDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  onListed: () => void;
}

export function ListDeckModal({
  isOpen,
  onClose,
  deckId,
  onListed,
}: ListDeckModalProps) {
  const { t } = useTranslation("marketplace");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [priceType, setPriceType] = useState<"free" | "paid">("free");
  const [priceStr, setPriceStr] = useState("0.99");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    const priceInCents =
      priceType === "free" ? 0 : Math.round(parseFloat(priceStr) * 100);

    if (priceType === "paid" && (isNaN(priceInCents) || priceInCents < 99)) {
      setError("Minimum price is $0.99");
      return;
    }
    if (priceInCents > 9999) {
      setError("Maximum price is $99.99");
      return;
    }

    setIsSubmitting(true);
    try {
      await marketplaceApi.listDeck(deckId, priceInCents);
      showToast(t("listDeck.listed"));
      onListed();
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("listDeck.title")}>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-neutral-700">Pricing</p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setPriceType("free")}
              className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                priceType === "free"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600"
              }`}
            >
              {t("free")}
            </button>
            <button
              type="button"
              onClick={() => setPriceType("paid")}
              className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                priceType === "paid"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600"
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        {priceType === "paid" && (
          <div>
            <label className="text-sm font-medium text-neutral-700">
              Price (USD)
            </label>
            <div className="mt-1">
              <Input
                type="number"
                min="0.99"
                max="99.99"
                step="0.01"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="0.99"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-error-500">{error}</p>}

        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("listDeck.listing") : t("listDeck.list")}
        </Button>
      </div>
    </Modal>
  );
}
