import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { profileApi } from "@/lib/profile-api";
import { Button } from "@versado/ui";

const SORTING_KEYS = ["dueFirst", "random", "byDifficulty"] as const;
const SORTING_VALUES = {
  dueFirst: "due_first",
  random: "random",
  byDifficulty: "difficulty",
} as const;

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
  const { t } = useTranslation("profile");
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
      showToast(t("cardSortingModal.updated"));
      onSaved(selected);
      onClose();
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("cardSortingModal.title")} size="sm">
      <div className="flex flex-col gap-2">
        {SORTING_KEYS.map((key) => {
          const apiValue = SORTING_VALUES[key];
          return (
            <button
              key={key}
              onClick={() => setSelected(apiValue)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected === apiValue
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <p className="text-sm font-medium text-neutral-900">
                {t(`sorting.${key}`)}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {t(`sorting.${key}Desc`)}
              </p>
            </button>
          );
        })}
      </div>
      <Button
        className="mt-4"
        fullWidth
        onClick={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? t("cardSortingModal.saving") : t("cardSortingModal.save")}
      </Button>
    </Modal>
  );
}
