import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import type { FlashcardResponse } from "@/lib/deck-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
import { Button } from "@versado/ui";

interface CardRow {
  front: string;
  back: string;
}

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  onAdded: (cards: FlashcardResponse[]) => void;
}

function emptyRow(): CardRow {
  return { front: "", back: "" };
}

export function AddCardModal({
  isOpen,
  onClose,
  deckId,
  onAdded,
}: AddCardModalProps) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<CardRow[]>([emptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateRow(index: number, field: keyof CardRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setRows([emptyRow()]);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validCards = rows.filter(
      (r) => r.front.trim() && r.back.trim()
    );

    if (validCards.length === 0) {
      setError("Add at least one card with both front and back");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const cards = await syncAwareApi.createCards({
        deckId,
        cards: validCards.map((r) => ({
          front: r.front.trim(),
          back: r.back.trim(),
        })),
      });
      showToast(`${cards.length} card${cards.length > 1 ? "s" : ""} added!`);
      resetForm();
      onAdded(cards);
    } catch {
      setError("Failed to add cards. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Cards" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
          {rows.map((row, i) => (
            <div key={i} className="relative rounded-lg border border-neutral-200 p-3">
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="absolute top-2 right-2 rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Front (question)"
                  value={row.front}
                  onChange={(e) => updateRow(i, "front", e.target.value)}
                  rows={2}
                />
                <Textarea
                  placeholder="Back (answer)"
                  value={row.back}
                  onChange={(e) => updateRow(i, "back", e.target.value)}
                  rows={2}
                />
              </div>
              <p className="mt-1 text-right text-xs text-neutral-400">
                Card {i + 1}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2.5 text-sm text-neutral-500 transition-colors hover:border-primary-400 hover:text-primary-500"
        >
          <Plus className="h-4 w-4" />
          Add Another Card
        </button>

        {error && <p className="text-sm text-error-500">{error}</p>}

        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting
            ? "Adding..."
            : `Add ${rows.filter((r) => r.front.trim() && r.back.trim()).length} Card${rows.filter((r) => r.front.trim() && r.back.trim()).length !== 1 ? "s" : ""}`}
        </Button>
      </form>
    </Modal>
  );
}
