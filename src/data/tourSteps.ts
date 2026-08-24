export interface TourStep {
  id: string;
  /** CSS selector for `document.querySelector` -- matches a `data-tour-target`
   * attribute placed on the real, already-rendered element (see
   * SpotlightTour). Desktop-only elements, so the tour itself only runs at
   * or above the `md` breakpoint. */
  targetSelector: string;
  title: string;
  body: string;
}

/** The guided spotlight tour's steps, in the nav's own left-to-right reading
 * order. Deliberately limited to persistently-visible, `position: fixed`
 * chrome -- a line's sidebar pill and a volume tile were considered and
 * ruled out (see the plan): both move under scroll/zoom/mount-transition in
 * ways a spotlight can't reliably track, and neither is guaranteed to be
 * on screen at all depending on a visitor's data. What a line/volume *is*
 * is covered as prose in OnboardingClosingModal/ReferenceModal instead. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "collections",
    targetSelector: '[data-tour-target="collection-tabs"]',
    title: "Five collections, five timelines",
    body: "Each tab is its own timeline -- Marvel's Epic Collection, Ultimate, Modern, and Licensed lines, plus DC Finest. Switch anytime; your place on each is remembered.",
  },
  {
    id: "search",
    targetSelector: '[data-tour-target="search-box"]',
    title: "Search, and filter",
    body: "Search matches line and volume titles as you type. The slider icon opens filters for shelving status, reading status, and tags.",
  },
  {
    id: "settings",
    targetSelector: '[data-tour-target="settings-gear"]',
    title: "Settings",
    body: "Export or import your data, reset a line, check keyboard shortcuts, or open the full reference guide -- all live here.",
  },
  {
    id: "speculation",
    targetSelector: '[data-tour-target="speculation-toggle"]',
    title: "Speculation Mode",
    body: "A sandbox for lines and volumes that haven't been announced -- your own what-ifs, kept separate from the real catalog until you turn it off.",
  },
  {
    id: "zoom",
    targetSelector: '[data-tour-target="zoom-control"]',
    title: "Zoom",
    body: "Zoom in for detail, out for a wider view of the timeline.",
  },
  {
    id: "add-line",
    targetSelector: '[data-tour-target="add-line-button"]',
    title: "Add your own line",
    body: "Track a series that isn't already here, official or speculative.",
  },
];
