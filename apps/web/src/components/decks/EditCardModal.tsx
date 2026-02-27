import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import type { FlashcardResponse } from "@/lib/deck-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
import { Button } from "@versado/ui";

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: FlashcardResponse;
  onUpdated: (card: FlashcardResponse) => void;
}

export function EditCardModal({
  isOpen,
  onClose,
  card,
  onUpdated,
}: EditCardModalProps) {
  const { t } = useTranslation("decks");
  const { showToast } = useToast();
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFront(card.front);
      setBack(card.back);
      setError("");
    }
  }, [isOpen, card]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      setError(t("editCardModal.validation"));
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const updated = await syncAwareApi.updateCard(card.id, {
        front: front.trim(),
        back: back.trim(),
      });
      showToast(t("editCardModal.updated"));
      onUpdated(updated);
    } catch {
      setError(t("editCardModal.failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("editCardModal.title")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Textarea
          label={t("editCardModal.frontLabel")}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          rows={3}
          autoFocus
        />
        <Textarea
          label={t("editCardModal.backLabel")}
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={3}
        />
        {error && <p className="text-sm text-error-500">{error}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("editCardModal.saving") : t("editCardModal.save")}
        </Button>
      </form>
    </Modal>
  );
}
