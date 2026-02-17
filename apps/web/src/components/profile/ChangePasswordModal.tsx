import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { profileApi } from "@/lib/profile-api";
import { ApiError } from "@/lib/api-client";
import { Input, Button } from "@flashcard/ui";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
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
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await profileApi.changePassword({ currentPassword, newPassword, confirmPassword });
      showToast("Password changed!");
      resetForm();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to change password");
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Change Password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoFocus
        />
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="text-sm text-error-500">{error}</p>}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </Modal>
  );
}
