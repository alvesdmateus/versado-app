import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@versado/ui";
import { Modal } from "@/components/shared";
import { marketplaceApi } from "@/lib/marketplace-api";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";

interface ShareDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  onShared: () => void;
}

export function ShareDeckModal({
  isOpen,
  onClose,
  deckId,
  onShared,
}: ShareDeckModalProps) {
  const { t } = useTranslation("community");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await marketplaceApi.listDeck(deckId, 0);
      showToast(t("shareDeck.shared"));
      onShared();
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("shareDeck.title")}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          {t("shareDeck.description")}
        </p>
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("shareDeck.sharing") : t("shareDeck.share")}
        </Button>
      </div>
    </Modal>
  );
}
