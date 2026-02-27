import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Home } from "lucide-react";
import { Button } from "@versado/ui";

function NotFoundIcon() {
  return (
    <svg
      className="h-24 w-24"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="18"
        y="10"
        width="40"
        height="56"
        rx="8"
        fill="var(--color-primary-500)"
      />
      <text
        x="38"
        y="50"
        textAnchor="middle"
        fill="white"
        fontSize="32"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        ?
      </text>
    </svg>
  );
}

export function NotFoundPage() {
  const { t } = useTranslation(["home", "common"]);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">{t("common:actions.back")}</span>
        </button>
        <h1 className="flex-1 truncate text-center text-lg font-semibold text-neutral-900 pr-14">
          {t("notFound.title")}
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center px-8 pt-8">
        {/* Hero illustration */}
        <div className="relative flex items-center justify-center">
          <span className="select-none text-[120px] font-black leading-none text-primary-100">
            404
          </span>
          <div className="absolute">
            <NotFoundIcon />
          </div>
        </div>

        {/* Copy */}
        <h2 className="mt-4 text-center text-lg font-bold text-neutral-900">
          {t("notFound.heading")}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          {t("notFound.description")}
        </p>

        {/* Actions */}
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <Button fullWidth onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            {t("notFound.backHome")}
          </Button>
          <button className="text-sm text-neutral-400 transition-colors hover:text-neutral-600">
            {t("notFound.helpCenter")}
          </button>
        </div>
      </div>
    </div>
  );
}
