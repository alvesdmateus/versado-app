import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { PrimaryButton, Spinner } from "./ui";

/** One step up the course → chapter hierarchy. */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gb-mute underline-offset-4 hover:text-gb-ink hover:underline"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner />
    </div>
  );
}

export function ErrorBlock({ title, onRetry }: { title: string; onRetry: () => void }) {
  const { t } = useTranslation("learn");
  return (
    <section className="flex flex-col gap-4 px-5 py-10">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="text-gb-mute">{t("home.error.body")}</p>
      <PrimaryButton onClick={onRetry}>{t("home.error.retry")}</PrimaryButton>
    </section>
  );
}

export function MissingBlock({ title, body, back, backLabel }: { title: string; body: string; back: string; backLabel: string }) {
  return (
    <section className="flex flex-col gap-3 px-5 py-10">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="text-gb-mute">{body}</p>
      <BackLink to={back}>{backLabel}</BackLink>
    </section>
  );
}

/** "Domain · 3 of 11 modules · 2 checks due": the meta line under a page title. */
export function MetaLine({ parts, due }: { parts: string[]; due: number }) {
  const { t } = useTranslation("learn");
  return (
    <p className="mt-2 text-sm text-gb-mute">
      {parts.join(" · ")}
      {due > 0 && (
        <>
          {" · "}
          <Link to="/review" className="font-semibold text-band-blue underline-offset-4 hover:underline">
            {t("home.due", { count: due })}
          </Link>
        </>
      )}
    </p>
  );
}
