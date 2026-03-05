import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export function CommunityHeader() {
  const { t } = useTranslation("community");

  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-2">
      <h1 className="text-2xl font-bold text-neutral-900">{t("heading")}</h1>
      <span className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500">
        <Users className="h-5 w-5" />
      </span>
    </header>
  );
}
