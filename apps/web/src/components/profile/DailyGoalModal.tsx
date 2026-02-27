import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { profileApi } from "@/lib/profile-api";
import { Input, Button } from "@versado/ui";

interface DailyGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  onSaved: (goal: number) => void;
}

export function DailyGoalModal({
  isOpen,
  onClose,
  currentGoal,
  onSaved,
}: DailyGoalModalProps) {
  const { t } = useTranslation("profile");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [goal, setGoal] = useState(String(currentGoal));
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(goal);
    if (isNaN(value) || value < 1 || value > 500) return;

    setIsSubmitting(true);
    try {
      await profileApi.updatePreferences({ dailyGoal: value });
      showToast(t("dailyGoalModal.updated"));
      onSaved(value);
      onClose();
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("dailyGoalModal.title")} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-neutral-600">
          {t("dailyGoalModal.description")}
        </p>
        <Input
          type="number"
          min={1}
          max={500}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          autoFocus
        />
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("dailyGoalModal.saving") : t("dailyGoalModal.save")}
        </Button>
      </form>
    </Modal>
  );
}
