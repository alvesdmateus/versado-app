import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
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
import { Button } from "@versado/ui";

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

const TOTAL_STEPS = 3;
const SWIPE_THRESHOLD = 50;

export function FluentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const dragStartX = useRef(0);
  const isDragging = useRef(false);

  const goTo = useCallback((nextStep: number) => {
    if (nextStep < 0 || nextStep >= TOTAL_STEPS) return;
    setIsTransitioning(true);
    setStep(nextStep);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isTransitioning) return;
    dragStartX.current = e.clientX;
    isDragging.current = true;
    setDragOffset(0);
  }, [isTransitioning]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    // Clamp drag at edges
    if ((step === 0 && dx > 0) || (step === TOTAL_STEPS - 1 && dx < 0)) {
      setDragOffset(dx * 0.3); // rubber-band effect
    } else {
      setDragOffset(dx);
    }
  }, [step]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragOffset < -SWIPE_THRESHOLD && step < TOTAL_STEPS - 1) {
      goTo(step + 1);
    } else if (dragOffset > SWIPE_THRESHOLD && step > 0) {
      goTo(step - 1);
    }
    setDragOffset(0);
  }, [dragOffset, step, goTo]);

  const slideStyle = {
    transform: `translateX(calc(${-step * 100}% + ${dragOffset}px))`,
    transition: isDragging.current ? "none" : "transform 0.3s ease-out",
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-neutral-50 overflow-hidden">
      {/* Back button */}
      <div className="flex px-5 pt-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100/50"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700" />
        </button>
      </div>

      {/* Carousel viewport */}
      <div
        className="flex-1 touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex h-full" style={slideStyle}>
          {/* Step 1: Hero + Stats */}
          <div className="w-full flex-shrink-0 overflow-y-auto px-5 pb-4">
            <div className="relative mt-2 text-center">
              <div className="pointer-events-none absolute inset-0 mx-auto h-72 w-72 rounded-full bg-primary-400/40 blur-3xl" />
              <h2 className="relative mt-6 text-4xl font-bold leading-tight text-neutral-900">
                Invest in
                <br />
                <span className="text-primary-500">Yourself</span>
              </h2>
              <p className="relative mx-auto mt-3 max-w-xs text-sm text-neutral-500">
                Memorize everything you need to achieve. From curious to fluent.
              </p>
            </div>

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
          </div>

          {/* Step 2: Benefits */}
          <div className="w-full flex-shrink-0 overflow-y-auto px-5 pb-4">
            <h3 className="mt-2 text-xs font-bold tracking-wider text-neutral-400 uppercase">
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

          {/* Step 3: Pricing Table */}
          <div className="w-full flex-shrink-0 overflow-y-auto px-5 pb-4">
            <div className="mt-2 text-center">
              <h2 className="text-2xl font-bold text-neutral-900">
                Choose Your Plan
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Start your journey to fluency today.
              </p>
            </div>
            <div className="mt-6">
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
      </div>

      {/* Footer: dots + navigation */}
      <div className="px-5 pb-6 pt-3">
        {/* Step dots */}
        <div className="mb-4 flex justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-primary-500" : "w-2 bg-neutral-300"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {step < TOTAL_STEPS - 1 ? (
          <>
            <Button fullWidth onClick={() => goTo(step + 1)}>
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              onClick={() => goTo(TOTAL_STEPS - 1)}
              className="mt-2 w-full py-2 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
            >
              Skip to pricing
            </button>
          </>
        ) : (
          <button
            onClick={() => goTo(0)}
            className="w-full py-2 text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
          >
            Back to overview
          </button>
        )}
      </div>
    </div>
  );
}
