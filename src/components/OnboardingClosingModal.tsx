import { SettingsModal } from "./SettingsModal";

interface ClosingSection {
  title: string;
  body: string;
}

const SECTIONS: ClosingSection[] = [
  {
    title: "Keyboard shortcuts",
    body: 'Almost everything has one -- press "?" anytime to see the full list.',
  },
  {
    title: "Speculation Mode",
    body: "The toggle you just saw opens a sandbox for lines and volumes that haven't been announced. It never touches your real shelf, and everything in it disappears from view (not deleted) the moment you turn it back off.",
  },
  {
    title: "Your data",
    body: "Everything -- your shelf, your corrections, your speculative lines -- lives only in this browser. Export it from Settings to back it up or move it to another device.",
  },
];

/**
 * Reached after finishing the spotlight tour (or, on a narrow viewport,
 * right after WelcomeModal -- see OnboardingFlow): a few sentences on
 * what isn't visible on screen. The exhaustive version of all of this
 * lives in ReferenceModal, which "Open the full guide" opens.
 */
export function OnboardingClosingModal({
  onOpenGuide,
  onDone,
}: {
  onOpenGuide: () => void;
  onDone: () => void;
}) {
  return (
    <SettingsModal title="A few things that aren't on screen" onClose={onDone} maxWidthClassName="max-w-md">
      <div className="mt-3 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {section.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-300">{section.body}</p>
          </div>
        ))}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Done
          </button>
          <button
            type="button"
            onClick={onOpenGuide}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200"
          >
            Open the full guide
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
