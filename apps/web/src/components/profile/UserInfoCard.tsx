import { useTranslation } from "react-i18next";
import { User } from "lucide-react";

export interface UserInfoCardProps {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  tier: "free" | "fluent";
}

export function UserInfoCard({ displayName, email, avatarUrl, tier }: UserInfoCardProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-4 flex flex-col items-center px-5">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-100">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <User className="h-10 w-10 text-primary-400" />
        )}
      </div>
      <h2 className="mt-3 text-lg font-bold text-neutral-900">{displayName}</h2>
      <p className="mt-0.5 text-sm text-neutral-500">{email}</p>
      {tier !== "free" && (
        <span className="mt-2 rounded-full bg-warning-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-warning-700">
          {t("profile.fluentMember")}
        </span>
      )}
    </div>
  );
}
