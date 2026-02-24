import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { deckApi, type DeckResponse } from "@/lib/deck-api";
import { Input, Button } from "@versado/ui";

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (deck: DeckResponse) => void;
}

export function CreateDeckModal({
  isOpen,
  onClose,
  onCreated,
}: CreateDeckModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setDescription("");
    setError("");
  }

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
      const deck = await deckApi.create({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      showToast(t("deck.createSuccess"));
      resetForm();
      onCreated(deck);
    } catch {
      setError(t("deck.createError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("deck.createTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("deck.createName")}
          placeholder={t("deck.createNamePlaceholder")}
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
          {isSubmitting ? t("common.creating") : t("common.create")}
        </Button>
      </form>
    </Modal>
  );
}
