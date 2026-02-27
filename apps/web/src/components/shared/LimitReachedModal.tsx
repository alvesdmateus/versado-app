import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@versado/ui";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LimitReachedModal({ isOpen, onClose }: LimitReachedModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("study");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
      <div className="relative w-full max-w-sm rounded-3xl bg-neutral-0 p-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-0/80 text-neutral-500 backdrop-blur-sm transition-colors hover:bg-neutral-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <div className="overflow-hidden rounded-2xl">
          <img
            src="/images/limit-reached.svg"
            alt={t("limitReached.imageAlt")}
            className="block w-full"
          />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-5 text-center">
          <h2 className="text-xl font-bold text-neutral-900">
            {t("limitReached.heading")}
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            {t("limitReached.message")}{" "}
            <button
              onClick={() => {
                onClose();
                navigate("/fluent");
              }}
              className="font-semibold text-primary-500"
            >
              {t("limitReached.goFluent")}
            </button>
            .
          </p>

          {/* CTA */}
          <div className="mt-5 flex flex-col gap-2">
            <Button
              fullWidth
              onClick={() => {
                onClose();
                navigate("/fluent");
              }}
            >
              {t("limitReached.goFluent")}
            </Button>
            <button
              onClick={onClose}
              className="py-2 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
            >
              {t("limitReached.maybeLater")}
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              <div className="h-6 w-6 rounded-full bg-primary-200 ring-2 ring-neutral-0" />
              <div className="h-6 w-6 rounded-full bg-primary-300 ring-2 ring-neutral-0" />
              <div className="h-6 w-6 rounded-full bg-primary-400 ring-2 ring-neutral-0" />
            </div>
            <span className="text-xs text-neutral-500">
              {t("limitReached.socialProof")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
