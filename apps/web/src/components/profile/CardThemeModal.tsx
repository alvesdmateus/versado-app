import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { profileApi } from "@/lib/profile-api";
import { CARD_THEMES } from "@/lib/card-themes";

interface CardThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onSaved: (theme: string) => void;
}

export function CardThemeModal({
  isOpen,
  onClose,
  currentTheme,
  onSaved,
}: CardThemeModalProps) {
  const { t } = useTranslation("profile");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [selected, setSelected] = useState(currentTheme);

  async function handleSelect(themeKey: string) {
    setSelected(themeKey);
    try {
      await profileApi.updatePreferences({ cardTheme: themeKey });
      showToast(t("cardThemeModal.updated"));
      onSaved(themeKey);
      onClose();
    } catch (err) {
      showErrorNotification(err);
      setSelected(currentTheme);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("cardThemeModal.title")} size="sm">
      <div className="grid grid-cols-4 gap-3">
        {CARD_THEMES.map((theme) => (
          <button
            key={theme.key}
            onClick={() => handleSelect(theme.key)}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={`relative flex h-14 w-10 items-center justify-center rounded-lg ${theme.previewColor} transition-transform hover:scale-110`}
            >
              {selected === theme.key && (
                <Check className="h-4 w-4 text-primary-500" />
              )}
            </div>
            <span className="text-xs text-neutral-600">{theme.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
