import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button, Input } from "@versado/ui";
import { Modal } from "@/components/shared/Modal";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/profile-api";
import { ApiError } from "@/lib/api-client";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { t } = useTranslation("profile");
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmText === "DELETE";

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    if (!canDelete) return;

    setIsDeleting(true);
    setError("");

    try {
      await profileApi.deleteAccount();
      await logout();
      navigate("/auth/login");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("deleteAccountModal.failed"));
      }
      setIsDeleting(false);
    }
  }

  function handleClose() {
    setConfirmText("");
    setError("");
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("deleteAccountModal.title")} size="sm">
      <div className="space-y-4">
        <div className="rounded-lg bg-error-50 p-3">
          <p className="text-sm font-medium text-error-700">
            {t("deleteAccountModal.warning")}
          </p>
          <p className="mt-1 text-sm text-error-600">
            {t("deleteAccountModal.details")}
          </p>
        </div>

        <form onSubmit={handleDelete}>
          <Input
            label={t("deleteAccountModal.confirmLabel")}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t("deleteAccountModal.placeholder")}
          />

          {error && <p className="mt-2 text-sm text-error-500">{error}</p>}

          <div className="mt-4 flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleClose}
              disabled={isDeleting}
            >
              {t("deleteAccountModal.cancel")}
            </Button>
            <button
              type="submit"
              disabled={!canDelete || isDeleting}
              className="flex-1 rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-error-600 disabled:opacity-50"
            >
              {isDeleting ? t("deleteAccountModal.deleting") : t("deleteAccountModal.delete")}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
