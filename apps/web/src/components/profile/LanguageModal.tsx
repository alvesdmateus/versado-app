import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { profileApi } from "@/lib/profile-api";
import { Button } from "@versado/ui";
import { SUPPORTED_LANGUAGES } from "@/i18n/supported-languages";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSaved: (language: string) => void;
}

export function LanguageModal({
  isOpen,
  onClose,
  currentLanguage,
  onSaved,
}: LanguageModalProps) {
  const { t, i18n } = useTranslation("profile");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [selected, setSelected] = useState(currentLanguage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    setIsSubmitting(true);
    const prevLang = i18n.language;
    try {
      i18n.changeLanguage(selected);
      await profileApi.updatePreferences({ nativeLanguage: selected });
      showToast(t("languageModal.updated"));
      onSaved(selected);
      onClose();
    } catch (err) {
      i18n.changeLanguage(prevLang);
      showErrorNotification(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("languageModal.title")} size="sm">
      <div className="flex flex-col gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelected(lang.code)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selected === lang.code
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <p className="text-sm font-medium text-neutral-900">
              {lang.label}
            </p>
          </button>
        ))}
      </div>
      <Button
        className="mt-4"
        fullWidth
        onClick={handleSave}
        disabled={isSubmitting || selected === currentLanguage}
      >
        {isSubmitting ? t("languageModal.saving") : t("languageModal.save")}
      </Button>
    </Modal>
  );
}
