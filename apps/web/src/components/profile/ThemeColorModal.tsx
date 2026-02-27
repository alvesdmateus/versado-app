import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { profileApi } from "@/lib/profile-api";

const THEME_COLORS = [
  { name: "Sky", value: "sky", className: "bg-sky-500" },
  { name: "Blue", value: "blue", className: "bg-blue-500" },
  { name: "Indigo", value: "indigo", className: "bg-indigo-500" },
  { name: "Violet", value: "violet", className: "bg-violet-500" },
  { name: "Rose", value: "rose", className: "bg-rose-500" },
  { name: "Orange", value: "orange", className: "bg-orange-500" },
  { name: "Emerald", value: "emerald", className: "bg-emerald-500" },
  { name: "Teal", value: "teal", className: "bg-teal-500" },
];

interface ThemeColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  onSaved: (color: string) => void;
}

export function ThemeColorModal({
  isOpen,
  onClose,
  currentColor,
  onSaved,
}: ThemeColorModalProps) {
  const { t } = useTranslation("profile");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [selected, setSelected] = useState(currentColor);

  async function handleSelect(color: string) {
    setSelected(color);
    try {
      await profileApi.updatePreferences({ themeColor: color });
      showToast(t("themeColorModal.updated"));
      onSaved(color);
      onClose();
    } catch (err) {
      showErrorNotification(err);
      setSelected(currentColor);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("themeColorModal.title")} size="sm">
      <div className="grid grid-cols-4 gap-3">
        {THEME_COLORS.map((theme) => (
          <button
            key={theme.value}
            onClick={() => handleSelect(theme.value)}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${theme.className} transition-transform hover:scale-110`}
            >
              {selected === theme.value && (
                <Check className="h-5 w-5 text-white" />
              )}
            </div>
            <span className="text-xs text-neutral-600">{theme.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
