import { SettingsModal } from "./SettingsModal";

// Matches OnboardingFlow's own DESKTOP_QUERY -- the tour's targets are the
// desktop nav's tabs/search/settings, which don't exist in the DOM below
// this breakpoint (see TopNav.tsx's `md:flex` wrappers), so the replay
// entry point below only makes sense to offer here too.
const DESKTOP_QUERY = "(min-width: 768px)";

interface GuideSection {
  title: string;
  paragraphs: string[];
}

const SECTIONS: GuideSection[] = [
  {
    title: "Collections & timelines",
    paragraphs: [
      "Each tab across the top is a collection -- Marvel's Epic Collection, Ultimate, Modern, and Licensed lines, and DC Finest -- with its own timeline underneath.",
      'A "line" is a row: one ongoing series of trade paperbacks (e.g. one Epic Collection title). A "volume" is a tile on that row: one collected book, positioned by the quarter it published in. Click any tile to open its details.',
    ],
  },
  {
    title: "Your shelf",
    paragraphs: [
      "Open a volume's tile to set its shelving status (Owned, Wishlist, and so on) and, separately, your reading status -- the two track different things and don't have to match.",
      "Lines can carry tags too, set from the line's own edit form; the filter panel can narrow the timeline down to just tagged lines.",
    ],
  },
  {
    title: "Search & filters",
    paragraphs: [
      "The nav search box matches line and volume titles as you type, trimming the timeline down to just what matches. The slider icon next to it opens the filter panel: shelving status, reading status, and tags, each multi-select, combined with either \"any\" (OR) or \"all\" (AND).",
    ],
  },
  {
    title: "Speculation Mode",
    paragraphs: [
      "The toggle on the right edge opens a sandbox layer for lines and volumes that haven't actually been announced -- your own predictions or wishes, kept visually distinct (a soft glow around the whole page) from the real catalog.",
      "Speculative content only shows while the toggle is on, and never mixes with or overwrites real data. Turning it off just hides it again; nothing is deleted.",
    ],
  },
  {
    title: "Adding & editing",
    paragraphs: [
      'The "Add Line" button (bottom-left) starts a new row. Hovering an empty quarter on an existing line reveals a "+" shortcut that starts a new volume there with the start date pre-filled.',
      "A volume tile's left and right edges can be dragged directly on the timeline to resize its run of quarters, instead of opening the edit form just to change dates.",
    ],
  },
  {
    title: "Zoom & the era bar",
    paragraphs: [
      "The zoom control (below the Speculation Mode toggle) steps between three levels of detail.",
      "DC Finest's timeline also shows an era bar above the year axis -- Golden, Silver, Bronze, and Post-Crisis -- so a volume's place in comics history is visible alongside its publication date.",
    ],
  },
  {
    title: "Your data",
    paragraphs: [
      "Everything you set -- shelving and reading status, your own corrections, speculative lines and volumes -- lives only in this browser's storage, never on a server.",
      'Export/Import (Settings menu) is how you back it up or move it to another device. Reset can be scoped to just volume metadata, just shelving/reading status, or both, so undoing a correction doesn\'t have to wipe your shelf too. "Storage debug" shows exactly what\'s stored and how much room it takes.',
    ],
  },
];

/**
 * The persistent, detailed reference guide -- unlike WelcomeModal/
 * SpotlightTour/OnboardingClosingModal (OnboardingFlow), this has no
 * first-visit gating at all: it's reachable anytime from Settings ("Guide"),
 * and from OnboardingClosingModal's "Open the full guide". Open state is
 * owned by App.tsx (see TopNav's onOpenReference prop) rather than locally
 * like AboutModal/UpdatesModal, since more than one place needs to open it.
 */
export function ReferenceModal({
  open,
  onClose,
  onOpenShortcuts,
  onReplayTour,
}: {
  open: boolean;
  onClose: () => void;
  /** Closes this modal and opens KeyboardShortcutsModal instead of
   * duplicating its content here -- that content already has a single
   * source of truth (globalShortcutHelp / PANEL_SHORTCUTS) and repeating it
   * would just risk drift. */
  onOpenShortcuts: () => void;
  /** Closes this modal and re-runs SpotlightTour directly (not the full
   * WelcomeModal -> tour -> OnboardingClosingModal flow -- someone opening
   * this from Settings already knows the app, they just want the guided
   * walkthrough again). Reuses the same TOUR_STEPS the first-run tour does,
   * so any step added later for a new feature shows up here automatically
   * with no extra wiring. */
  onReplayTour: () => void;
}) {
  if (!open) return null;

  // Checked fresh each time the modal opens (it's unmounted/remounted via
  // the `open` gate above, not left sitting stale) rather than tracked with
  // a resize listener -- same one-time-check rigor as OnboardingFlow's own
  // use of this query, appropriate for a short-lived modal.
  const canReplayTour =
    typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;

  return (
    <SettingsModal title="Guide" onClose={onClose} maxWidthClassName="max-w-2xl">
      <div className="mt-4 min-h-0 flex-1 space-y-6 overflow-y-auto">
        {canReplayTour && (
          <div className="flex items-center justify-between gap-4 rounded-md border border-neutral-700 bg-neutral-800/50 px-3 py-2.5">
            <p className="text-xs text-neutral-400">
              Want the guided walkthrough of the UI again? New features pick up new stops here
              too.
            </p>
            <button
              type="button"
              onClick={onReplayTour}
              className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:text-white"
            >
              Replay tour
            </button>
          </div>
        )}
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {section.title}
            </h3>
            <div className="mt-1.5 space-y-2">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm text-neutral-300">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
        <div className="border-t border-neutral-800 pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenShortcuts();
            }}
            className="text-sm text-blue-400 underline hover:text-blue-300"
          >
            See keyboard shortcuts →
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
