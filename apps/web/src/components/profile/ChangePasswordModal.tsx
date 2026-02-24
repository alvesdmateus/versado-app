import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { profileApi } from "@/lib/profile-api";
import { ApiError } from "@/lib/api-client";
import { Input, Button } from "@versado/ui";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError(t("common.passwordAtLeast8"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("common.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await profileApi.changePassword({ currentPassword, newPassword, confirmPassword });
      showToast(t("profile.passwordChanged"));
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("profile.passwordChangeFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("profile.changePasswordTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("profile.currentPassword")}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoFocus
        />
        <Input
          label={t("profile.newPassword")}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label={t("profile.confirmNewPassword")}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-sm text-error-500">{error}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("profile.changingPassword") : t("profile.changePasswordButton")}
        </Button>
      </form>
    </Modal>
  );
}
