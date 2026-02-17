import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { profileApi } from "@/lib/profile-api";
import { Button } from "@flashcard/ui";

interface ReminderTimesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimes: string[];
  onSaved: (times: string[]) => void;
}

export function ReminderTimesModal({
  isOpen,
  onClose,
  currentTimes,
  onSaved,
}: ReminderTimesModalProps) {
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [times, setTimes] = useState<string[]>(currentTimes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addTime() {
    if (times.length >= 5) return;
    setTimes((prev) => [...prev, "09:00"]);
  }

  function removeTime(index: number) {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTime(index: number, value: string) {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  async function handleSave() {
    setIsSubmitting(true);
    try {
      await profileApi.updatePreferences({ reminderTimes: times });
      showToast("Reminders updated!");
      onSaved(times);
      onClose();
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reminder Times" size="sm">
      <div className="flex flex-col gap-3">
        {times.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-2">
            No reminders set
          </p>
        )}
        {times.map((time, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => updateTime(i, e.target.value)}
              className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              onClick={() => removeTime(i)}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:text-error-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {times.length < 5 && (
          <button
            onClick={addTime}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-sm text-neutral-500 transition-colors hover:border-primary-400 hover:text-primary-500"
          >
            <Plus className="h-4 w-4" />
            Add Reminder
          </button>
        )}
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
