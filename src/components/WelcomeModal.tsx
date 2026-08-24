import { SettingsModal } from "./SettingsModal";

/**
 * First thing a genuinely new visitor sees (see useOnboarding/OnboardingFlow)
 * -- deliberately high-level and easy to dismiss, not a wall of text. X,
 * Escape, and backdrop-click (all free from SettingsModal) all mean the same
 * thing as the explicit Skip below: end onboarding entirely, no fallback to
 * the closing modal. Only "Take the tour" continues into SpotlightTour.
 */
export function WelcomeModal({
  onStartTour,
  onSkip,
}: {
  onStartTour: () => void;
  onSkip: () => void;
}) {
  return (
    <SettingsModal title="Welcome to Epic Timeline" onClose={onSkip} maxWidthClassName="max-w-sm">
      <div className="mt-3 space-y-4">
        <p className="text-sm text-neutral-300">
          Track Marvel Epic Collection and DC Finest trade paperback lines on
          one visual timeline -- what's out, what's next, and what's already
          on your shelf.
        </p>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onStartTour}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            Take the tour
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
