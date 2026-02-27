import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import type { DeckResponse } from "@/lib/deck-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
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
  const { t } = useTranslation("decks");
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
      setError(t("createModal.nameRequired"));
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const deck = await syncAwareApi.createDeck({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      showToast(t("createModal.created"));
      resetForm();
      onCreated(deck);
    } catch {
      setError(t("createModal.failed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("createModal.title")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("createModal.nameLabel")}
          placeholder={t("createModal.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />
        <Textarea
          label={t("createModal.descriptionLabel")}
          placeholder={t("createModal.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("createModal.creating") : t("createModal.create")}
        </Button>
      </form>
    </Modal>
  );
}
