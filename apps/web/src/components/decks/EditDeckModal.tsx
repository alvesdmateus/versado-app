import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import type { DeckResponse } from "@/lib/deck-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
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
      setError("Deck name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const updated = await syncAwareApi.updateDeck(deck.id, {
        name: trimmedName,
        description: description.trim(),
      });
      showToast("Deck updated!");
      onUpdated(updated);
    } catch {
      setError("Failed to update deck. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Deck">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="What is this deck about? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Modal>
  );
}
