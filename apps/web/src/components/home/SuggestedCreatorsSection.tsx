import { useTranslation } from "react-i18next";
import type { SuggestedCreator } from "@/lib/social-api";
import { SectionHeader } from "./SectionHeader";
import { SuggestedCreatorCard } from "./SuggestedCreatorCard";

interface SuggestedCreatorsSectionProps {
  creators: SuggestedCreator[];
  followedUserIds: Set<string>;
  onToggleFollow: (creatorId: string) => void;
  onReportCreator?: (creatorId: string, displayName: string) => void;
  onBlockCreator?: (creatorId: string, displayName: string) => void;
}

export function SuggestedCreatorsSection({
  creators,
  followedUserIds,
  onToggleFollow,
  onReportCreator,
  onBlockCreator,
}: SuggestedCreatorsSectionProps) {
  const { t } = useTranslation("home");

  if (creators.length === 0) return null;

  return (
    <section className="mt-6">
      <SectionHeader title={t("suggestedCreators")} />
      <div className="scrollbar-hide mt-3 flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory">
        {creators.map((creator) => (
          <div key={creator.id} className="flex-shrink-0 snap-start">
            <SuggestedCreatorCard
              creator={creator}
              isFollowing={followedUserIds.has(creator.id)}
              onToggleFollow={() => onToggleFollow(creator.id)}
              onReport={onReportCreator}
              onBlock={onBlockCreator}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
