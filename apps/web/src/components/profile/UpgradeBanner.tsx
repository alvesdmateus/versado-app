import { useNavigate } from "react-router";
import { Sparkles } from "lucide-react";

export function UpgradeBanner() {
  const navigate = useNavigate();

  return (
    <div className="mx-5 mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-white" />
        <h3 className="text-lg font-bold text-white">Flashcard Plus</h3>
      </div>
      <p className="mt-1 text-sm text-primary-100">
        Unlock offline mode, unlimited decks, and AI-powered memory optimization.
      </p>
      <button
        onClick={() => navigate("/billing")}
        className="mt-3 rounded-full bg-neutral-0 px-6 py-2 text-sm font-semibold text-primary-600 transition-all hover:bg-primary-50 active:scale-95"
      >
        Upgrade Now
      </button>
    </div>
  );
}
