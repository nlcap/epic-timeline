import type { QuarterPoint, Volume } from "../types";
import { stepperVolumeTargets, STEPPER_PANEL_GAP_PX, type ZoomLevel } from "../lib/timeline";

/**
 * Hover panel on a line row's sidebar pill: forward/backward chevrons that
 * step through that line's volumes (gaps skipped), smooth-scrolling the
 * timeline so each one lands a fixed one-quarter-width clear of the pill's
 * own icon -- not the panel itself, which just floats in whatever room that
 * leaves (see refX below).
 *
 * Reveal doesn't depend on the pill's own hover state directly, but on
 * whether the pill is showing a label at all: visible without any hover of
 * its own whenever labelOpacity > 0 (the pill's default full-width resting
 * state, or hover-expanded while scrolled). Only while the pill is fully
 * collapsed to icon-only does it fall back to needing its own hover to
 * reveal. Position, unlike reveal, DOES track the pill's current width
 * (collapsed/default/hover-expanded) -- LineRow renders
 * the pill a little wider than its own content needs (see stepperReservePx)
 * specifically so this panel has room to sit just past the label, inset
 * within the pill's own background, without the two ever overlapping.
 *
 * Forward/backward targets are derived fresh from the live `scrollLeft` on
 * every render -- nearest volume ahead of / behind the panel's actual
 * current position -- rather than tracked as separate click-counted state.
 * A stored "current volume" pointer only advances when its own chevron is
 * clicked, so scrolling the timeline manually (a drag, a search, anything
 * that doesn't go through this component) leaves it stale: hover the panel
 * after scrolling past a line's last volume and a stale pointer still
 * thinks nothing precedes it, showing forward as the only active direction
 * and sending a click on it all the way back to the first volume -- a
 * "loop" the timeline never actually contains. Deriving from `scrollLeft`
 * directly makes that impossible: whichever volume is nearest behind/ahead
 * of wherever the user actually is is always what's offered, regardless of
 * how they got there.
 */
export function VolumeStepper({
  volumes,
  axisStart,
  pxPerQuarter,
  sidebarWidth,
  sidebarColumnWidth,
  sidebarGap,
  pillWidth,
  pillIconSize,
  labelOpacity,
  scrollLeft,
  zoomLevel,
  onStepScroll,
}: {
  volumes: Volume[];
  axisStart: QuarterPoint;
  pxPerQuarter: number;
  /** Raw content-fit sidebar width (from useSidebarWidth), NOT
   * sidebarColumnWidth below -- needed to predict the pill's own width at a
   * hypothetical future scroll position (see scrollTargetFor), which is
   * exactly what useSidebarPillMetrics itself takes as input. */
  sidebarWidth: number;
  /** The sidebar column's actual allocated width (sidebarWidth + the
   * stepper's own reserve, computed once in App.tsx) -- NOT the pill's own
   * content-fit width (that's pillWidth below). This is what
   * LineTimelineLane's local origin actually sits at (sidebarColumnWidth +
   * sidebarGap), since the row's outer sidebar div is now rendered at this
   * width too -- see LineRow.tsx. */
  sidebarColumnWidth: number;
  sidebarGap: number;
  pillWidth: number;
  /** The pill's fully-collapsed (icon-only) width -- same value LineRow
   * passes to useSidebarPillMetrics as collapsedWidth. Needed for the same
   * prediction as sidebarWidth above. */
  pillIconSize: number;
  /** Same 0-1 value already driving the pill's own label fade (see
   * useSidebarPillMetrics) -- >0 whenever the pill is showing a name, either
   * at rest (default full-width state) or hover-expanded while scrolled.
   * Forces this panel visible without needing its own hover in that case;
   * only the fully collapsed (icon-only, labelOpacity===0) state still gates
   * reveal behind hovering the panel itself. */
  labelOpacity: number;
  scrollLeft: number;
  zoomLevel: ZoomLevel;
  /** Called with the landing scroll position AND the volume being stepped
   * to -- the id lets the caller (LineRow) pop that volume's hover preview
   * open for a few seconds once the scroll settles, standing in for a real
   * hover the cursor (parked on this panel, not the tile) never makes. */
  onStepScroll: (targetScrollLeft: number, targetVolumeId: string) => void;
}) {
  // Tracks the pill's own current (content, not reserved) width -- collapsed
  // to icon-only, full sidebarWidth at rest, or hover-expanded to fit a
  // label -- so the panel always sits just past wherever the pill's real
  // content currently ends, never overlapping the label. This is what the
  // panel's own visual `left` below uses -- it should track reality exactly,
  // hover-expansion included.
  const panelLeft = pillWidth + STEPPER_PANEL_GAP_PX;

  // Forward/backward targets and the scroll-landing math -- shared with the
  // volume detail panel's own stepper (see stepperVolumeTargets in
  // lib/timeline.ts for the full derivation), since both are ultimately
  // driving the same pinned sidebar pill and its icon, just from different
  // trigger surfaces.
  const { backwardTarget, forwardTarget, scrollTargetFor } = stepperVolumeTargets(
    volumes,
    axisStart,
    pxPerQuarter,
    sidebarWidth,
    sidebarColumnWidth,
    sidebarGap,
    pillIconSize,
    scrollLeft,
    zoomLevel
  );

  const handleForward = () => {
    if (!forwardTarget) return;
    onStepScroll(scrollTargetFor(forwardTarget), forwardTarget.id);
  };

  const handleBackward = () => {
    if (!backwardTarget) return;
    onStepScroll(scrollTargetFor(backwardTarget), backwardTarget.id);
  };

  // STEPPER_BUTTON_SIZE_PX (22px, not the icon's own 16px) -- the extra 3px
  // on every side is clickable/hoverable hit area, not visual padding:
  // adjacent buttons sit flush against each other (no panel-level gap/
  // padding at all), so that margin reads as spacing while actually
  // belonging to whichever button is nearest, widening the real target
  // instead of leaving it as dead space between/around the icons. Not a
  // Tailwind default-scale size (h-5/w-5 was 20px; 22px needs an arbitrary
  // value) since Nick asked for the touch zone 1px wider per side on top of
  // that original 2px.
  const chevronClass =
    "flex h-[22px] w-[22px] shrink-0 items-center justify-center text-[#B3B3B3] transition-colors enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-20";

  return (
    <div
      className={`absolute z-20 flex shrink-0 items-center rounded-lg bg-black/20 opacity-0 backdrop-blur-sm transition-opacity duration-150 ease-out hover:opacity-100 ${
        zoomLevel === 3 ? "flex-row-reverse" : "flex-col"
      }`}
      style={{
        left: panelLeft,
        top: "50%",
        transform: `translate(${scrollLeft}px, -50%)`,
        // Forces the panel visible whenever the pill is showing a label
        // (default or hover-expanded state) without needing its own hover --
        // an inline style beats the className's opacity-0/hover:opacity-100
        // utilities, so this only applies while labelOpacity > 0; leaving it
        // unset (undefined, not 0) the rest of the time lets those utilities
        // keep governing the fully-collapsed state's hover-to-reveal as before.
        opacity: labelOpacity > 0 ? 1 : undefined,
      }}
    >
      <button
        type="button"
        onClick={handleForward}
        disabled={!forwardTarget}
        aria-label="Next volume"
        className={chevronClass}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={handleBackward}
        disabled={!backwardTarget}
        aria-label="Previous volume"
        className={chevronClass}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </div>
  );
}
