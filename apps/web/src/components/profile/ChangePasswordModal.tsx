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
  const { t } = useTranslation("profile");
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
      setError(t("changePasswordModal.minLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("changePasswordModal.mismatch"));
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await profileApi.changePassword({ currentPassword, newPassword, confirmPassword });
      showToast(t("changePasswordModal.success"));
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("changePasswordModal.failed"));
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t("changePasswordModal.title")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t("changePasswordModal.currentPassword")}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoFocus
        />
        <Input
          label={t("changePasswordModal.newPassword")}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label={t("changePasswordModal.confirmPassword")}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-sm text-error-500">{error}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("changePasswordModal.changing") : t("changePasswordModal.change")}
        </Button>
      </form>
    </Modal>
  );
}
