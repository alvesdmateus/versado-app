import { Flame } from "lucide-react";
import { StreakBadge } from "@flashcard/ui";

export interface HomeHeaderProps {
  userName: string;
  streakCount: number;
}

export function HomeHeader({ userName, streakCount }: HomeHeaderProps) {
  return (
    <header className="flex items-start justify-between px-5 pt-6 pb-2">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Hello, {userName}!
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Ready for a quick session?
        </p>
      </div>
      <StreakBadge
        count={streakCount}
        icon={<Flame className="h-4 w-4 text-success-500" />}
      />
    </header>
  );
}
