import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { deckApi, type DeckResponse } from "@/lib/deck-api";
import { Input, Button } from "@versado/ui";

interface EditDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: DeckResponse;
  onUpdated: (deck: DeckResponse) => void;
}

export function EditDeckModal({
  isOpen,
  onClose,
  deck,
  onUpdated,
}: EditDeckModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(deck.name);
      setDescription(deck.description);
      setError("");
    }
  }, [isOpen, deck]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("deck.createName"));
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const updated = await deckApi.update(deck.id, {
        name: trimmedName,
        description: description.trim(),
      });
      showToast(t("deck.editSuccess"));
      onUpdated(updated);
    } catch {
      setError(t("deck.editError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("deck.editTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("deck.createName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />
        <Textarea
          label={t("deck.createDescription")}
          placeholder={t("deck.createDescriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : t("common.save")}
        </Button>
      </form>
    </Modal>
  );
}
