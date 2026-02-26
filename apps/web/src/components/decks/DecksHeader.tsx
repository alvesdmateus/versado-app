import { MoreVertical } from "lucide-react";

export function DecksHeader() {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-2">
      <h1 className="text-2xl font-bold text-neutral-900">My Decks</h1>
      <button aria-label="More options" className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90">
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  );
}
