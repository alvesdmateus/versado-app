import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, MoreVertical } from "lucide-react";

export function ProfileHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation("profile");

  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-2">
      <button
        onClick={() => navigate(-1)}
        aria-label={t("header.goBack")}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-base font-semibold text-neutral-900">{t("header.title")}</span>
      <button aria-label={t("header.moreOptions")} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90">
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  );
}
