import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { profileApi } from "@/lib/profile-api";
import { Button } from "@flashcard/ui";

const SORTING_OPTIONS = [
  {
    value: "due_first" as const,
    label: "Due First",
    description: "Cards due for review are shown first",
  },
  {
    value: "random" as const,
    label: "Random",
    description: "Cards are shown in random order",
  },
  {
    value: "difficulty" as const,
    label: "By Difficulty",
    description: "Harder cards are shown first",
  },
];

interface CardSortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSorting: string;
  onSaved: (sorting: string) => void;
}

export function CardSortingModal({
  isOpen,
  onClose,
  currentSorting,
  onSaved,
}: CardSortingModalProps) {
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [selected, setSelected] = useState(currentSorting);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    try {
      await profileApi.updatePreferences({
        cardSortingLogic: selected as "due_first" | "random" | "difficulty",
      });
      showToast("Sorting preference updated!");
      onSaved(selected);
      onClose();
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Card Sorting" size="sm">
      <div className="flex flex-col gap-2">
        {SORTING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selected === opt.value
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <p className="text-sm font-medium text-neutral-900">{opt.label}</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              {opt.description}
            </p>
          </button>
        ))}
      </div>
      <Button
        className="mt-4"
        fullWidth
        onClick={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save"}
      </Button>
    </Modal>
  );
}
