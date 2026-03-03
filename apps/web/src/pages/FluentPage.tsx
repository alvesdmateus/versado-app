import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Layers,
  RefreshCw,
  BarChart3,
  WifiOff,
  ShoppingBag,
  Store,
  Infinity,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const FLUENT_BENEFITS = [
  {
    icon: Layers,
    title: "Unlimited Decks & Cards",
    description:
      "No restrictions on your knowledge base. Create thousands of cards.",
  },
  {
    icon: RefreshCw,
    title: "Cloud Sync",
    description:
      "Seamlessly transition between mobile, tablet, and desktop.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Deep dive into your retention rates and study habits.",
  },
  {
    icon: WifiOff,
    title: "Offline Study Mode",
    description:
      "Learn anywhere, even without an internet connection.",
  },
  {
    icon: ShoppingBag,
    title: "Priority Marketplace",
    description:
      "Get early access to expert-curated deck drops.",
  },
  {
    icon: Store,
    title: "Selling on Marketplace",
    description:
      "Monetize your expertise by selling your curated decks to other learners.",
  },
  {
    icon: Infinity,
    title: "Unlimited Daily Reviews",
    description:
      "Review as many cards as you want, whenever you want. No daily limits.",
  },
  {
    icon: Sparkles,
    title: "Limitless AI Card Generation",
    description:
      "Generate high-quality study cards instantly using our advanced AI engine.",
  },
];

export function FluentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-neutral-50">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Hero */}
        <div className="relative mt-4 text-center">
          {/* Back button */}
          <div className="flex">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100/50"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-700" />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-0 mx-auto h-72 w-72 rounded-full bg-primary-400/40 blur-3xl" />
          <h2 className="relative mt-9 text-4xl font-bold leading-tight text-neutral-900">
            Invest in
            <br />
            <span className="text-primary-500">Yourself</span>
          </h2>
          <p className="relative mx-auto mt-3 max-w-xs text-sm text-neutral-500">
            Memorize everything you need to achieve. From curious to fluent.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-200 bg-neutral-0 p-4">
            <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Daily Cost
            </p>
            <p className="mt-1 text-lg font-bold text-neutral-900">
              Less than $0.50
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Cheaper than a coffee per week.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-0 p-4">
            <p className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">
              Access
            </p>
            <p className="mt-1 text-lg font-bold text-neutral-900">
              Unlimited
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Cancel anytime, no commitments.
            </p>
          </div>
        </div>

        {/* Image banner */}
        <div className="relative mt-6 overflow-hidden rounded-2xl shadow-card">
          <img
            src="/images/fluent-banner-study.svg"
            alt="Limitless learning at your fingertips"
            className="block w-full"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-5">
            <p className="text-lg font-semibold leading-snug text-white drop-shadow-md">
              Limitless learning
              <br />
              at your fingertips.
            </p>
          </div>
        </div>

        {/* What's included */}
        <div className="mt-8">
          <h3 className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
            What's Included
          </h3>
          <div className="mt-4 space-y-3">
            {FLUENT_BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-0 p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
                  <benefit.icon className="h-5 w-5 text-primary-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    {benefit.title}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stripe Pricing Table */}
        <div className="mt-8">
          {/* @ts-expect-error Stripe Pricing Table web component */}
          <stripe-pricing-table
            pricing-table-id="prctbl_1T6x2Z4ZISSLoYxJtj9R7Vmo"
            publishable-key="pk_live_51T1o8y4ZISSLoYxJfKtqR2AYZVuuXHMcfCagGbRT4ylFfYg8g9j85Z9ASdoyxIr7gsVdYk1IlEaO9c1ooC99ztO2005mgVKGdv"
            client-reference-id={user?.id}
            customer-email={user?.email}
          />
        </div>
      </div>
    </div>
  );
}
