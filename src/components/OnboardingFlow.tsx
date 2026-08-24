import { useState } from "react";
import { WelcomeModal } from "./WelcomeModal";
import { SpotlightTour } from "./SpotlightTour";
import { OnboardingClosingModal } from "./OnboardingClosingModal";
import { TOUR_STEPS } from "../data/tourSteps";

// Matches Tailwind's `md` breakpoint, the same one TopNav forks its own
// desktop-vs-mobile rendering on -- below it, the tour's targets (desktop
// nav tabs/search/settings) genuinely aren't in the DOM (see TopNav.tsx's
// `hidden ... md:flex` wrappers), so there's nothing for a spotlight to
// find.
const DESKTOP_QUERY = "(min-width: 768px)";

type Stage = "welcome" | "tour" | "closing";

/**
 * Orchestrates the first-time flow: WelcomeModal -> (desktop only)
 * SpotlightTour -> OnboardingClosingModal. Rendered once, gated by
 * useOnboarding's `shouldShow` in App.tsx, same pattern as WhatsNewModal.
 *
 * Every exit path (Welcome's Skip/X/Escape/backdrop, a mid-tour "Skip
 * tour", the closing modal's Done or "Open the full guide") ends up calling
 * `onFinish` exactly once, marking onboarding seen -- see each stage's own
 * component for why a mid-tour skip ends everything immediately rather than
 * still funneling into the closing modal.
 */
export function OnboardingFlow({
  onFinish,
  onOpenReference,
}: {
  onFinish: () => void;
  onOpenReference: () => void;
}) {
  const [stage, setStage] = useState<Stage>("welcome");

  if (stage === "welcome") {
    return (
      <WelcomeModal
        onSkip={onFinish}
        onStartTour={() => setStage(window.matchMedia(DESKTOP_QUERY).matches ? "tour" : "closing")}
      />
    );
  }

  if (stage === "tour") {
    return (
      <SpotlightTour steps={TOUR_STEPS} onFinish={() => setStage("closing")} onSkip={onFinish} />
    );
  }

  return (
    <OnboardingClosingModal
      onDone={onFinish}
      onOpenGuide={() => {
        onOpenReference();
        onFinish();
      }}
    />
  );
}
