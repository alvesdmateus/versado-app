import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { deckApi, type DeckResponse } from "@/lib/deck-api";
import { Input, Button } from "@flashcard/ui";

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
      setError("Deck name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const deck = await deckApi.create({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      showToast("Deck created!");
      resetForm();
      onCreated(deck);
    } catch {
      setError("Failed to create deck. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Deck">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          placeholder="e.g. Spanish Vocabulary"
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
          {isSubmitting ? "Creating..." : "Create Deck"}
        </Button>
      </form>
    </Modal>
  );
}
