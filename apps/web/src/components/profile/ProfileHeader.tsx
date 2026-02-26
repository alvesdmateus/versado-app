import { useNavigate } from "react-router";
import { ChevronLeft, MoreVertical } from "lucide-react";

export function ProfileHeader() {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-2">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-base font-semibold text-neutral-900">Profile</span>
      <button aria-label="More options" className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90">
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  );
}
