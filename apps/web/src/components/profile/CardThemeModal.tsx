import { useState } from "react";
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
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [selected, setSelected] = useState(currentTheme);

  async function handleSelect(themeKey: string) {
    setSelected(themeKey);
    try {
      await profileApi.updatePreferences({ cardTheme: themeKey });
      showToast("Card theme updated!");
      onSaved(themeKey);
      onClose();
    } catch (err) {
      showErrorNotification(err);
      setSelected(currentTheme);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Card Theme" size="sm">
      <div className="grid grid-cols-2 gap-3">
        {CARD_THEMES.map((theme) => {
          const isSelected = selected === theme.key;
          return (
            <button
              key={theme.key}
              onClick={() => handleSelect(theme.key)}
              className={`relative overflow-hidden rounded-2xl ${
                isSelected ? "ring-2 ring-primary-500 ring-offset-2" : ""
              }`}
            >
              <div
                className={`flex aspect-square flex-col justify-between p-3 ${theme.previewColor}`}
                style={theme.backgroundStyle}
              >
                <div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                      <Check className="h-3.5 w-3.5 text-primary-500" />
                    </div>
                  )}
                  {!isSelected && (
                    <div className="h-6 w-6 rounded-full border-2 border-white/40" />
                  )}
                </div>
                <p className="text-xs font-semibold text-white">
                  {theme.name}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
