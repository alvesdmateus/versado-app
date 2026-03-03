import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import { Textarea } from "./Textarea";
import { Button } from "@versado/ui";
import { moderationApi, type ReportReason, type ReportTargetType } from "@/lib/moderation-api";
import { useToast } from "@/contexts/ToastContext";

const REASONS: ReportReason[] = [
  "inappropriate_content",
  "spam",
  "harassment",
  "intellectual_property",
  "other",
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  displayName: string;
}

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  displayName,
}: ReportModalProps) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose() {
    setReason(null);
    setDetails("");
    onClose();
  }

  async function handleSubmit() {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await moderationApi.report({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      showToast(t("report.submitted"));
      handleClose();
    } catch {
      showToast(t("report.error"), "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("report.title", { name: displayName })}
      size="sm"
    >
      <p className="mb-3 text-sm text-neutral-500">{t("report.description")}</p>

      <fieldset className="space-y-2">
        {REASONS.map((r) => (
          <label
            key={r}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
          >
            <input
              type="radio"
              name="report-reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="accent-primary-500"
            />
            <span className="text-neutral-700">{t(`report.reasons.${r}`)}</span>
          </label>
        ))}
      </fieldset>

      <div className="mt-3">
        <Textarea
          placeholder={t("report.detailsPlaceholder")}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p className="mt-1 text-right text-xs text-neutral-400">
          {details.length}/500
        </p>
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={handleClose}
          disabled={isSubmitting}
        >
          {t("actions.cancel")}
        </Button>
        <button
          onClick={handleSubmit}
          disabled={!reason || isSubmitting}
          className="flex-1 rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-error-600 disabled:opacity-50"
        >
          {isSubmitting ? "..." : t("report.submit")}
        </button>
      </div>
    </Modal>
  );
}
