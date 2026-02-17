import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { flashcardApi } from "@/lib/flashcard-api";
import type { FlashcardResponse } from "@/lib/deck-api";
import { Button } from "@flashcard/ui";

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
      setError("Both front and back are required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const updated = await flashcardApi.update(card.id, {
        front: front.trim(),
        back: back.trim(),
      });
      showToast("Card updated!");
      onUpdated(updated);
    } catch {
      setError("Failed to update card. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Card">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Textarea
          label="Front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          rows={3}
          autoFocus
        />
        <Textarea
          label="Back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={3}
        />
        {error && <p className="text-sm text-error-500">{error}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Modal>
  );
}
