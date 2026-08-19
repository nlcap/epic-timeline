import type { QuarterPoint, Volume } from "../types";
import {
  SIDEBAR_COLLAPSE_RANGE,
  spanToPx,
  STEPPER_ICON_OVERLAP_PX_BY_ZOOM,
  STEPPER_PANEL_GAP_PX,
  type ZoomLevel,
} from "../lib/timeline";

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

  // What panelLeft would be at a given scrollLeft if the pill were NOT
  // hovered -- i.e. useSidebarPillMetrics' own collapse formula, replicated
  // here rather than read live. Used for refX/forwardThreshold below instead
  // of the live panelLeft above, deliberately: a click can only ever land on
  // this panel by the cursor first reaching it, which (now that hover
  // tracking lives on the shared wrapping div, not the pill button itself --
  // see LineRow.tsx) means the pill is *already hover-expanded* for the
  // entire duration of essentially every real click. If classification used
  // the live (hover-inflated) panelLeft while scrollTargetFor predicts the
  // eventual NON-hovered landing (below), the two disagree about where "one
  // quarter of clearance" actually falls -- a volume the landing math
  // considers already-reached could still misclassify as "ahead" under the
  // inflated threshold, needing a second click to actually advance past it.
  // Keeping both calculations on the same (non-hovered) assumption is what
  // makes them consistent.
  const predictedPillWidthAt = (x: number): number => {
    const collapseProgress = Math.min(1, Math.max(0, x / SIDEBAR_COLLAPSE_RANGE));
    return sidebarWidth - collapseProgress * (sidebarWidth - pillIconSize);
  };

  // A volume's own rendered left edge, in the same content-coordinate space
  // spanToPx already uses -- sidebarColumnWidth + sidebarGap is
  // LineTimelineLane's local-origin offset within the row's shared scroll
  // content (confirmed against TimelineGrid/the sticky axis header, which
  // use the identical offset); the trailing "+ 1" matches TimelineEntryTile's
  // own deliberate 1px inset so this lines up with where the tile actually
  // renders.
  const contentXOf = (v: Volume): number => {
    const { left } = spanToPx(axisStart, v.start, v.end, pxPerQuarter);
    return sidebarColumnWidth + sidebarGap + left + 1;
  };

  // The ICON's own right edge (not the panel's), in that same content-
  // coordinate space, at the CURRENT scroll position -- using the PREDICTED
  // (non-hovered) width, per the comment above. "One quarter of clearance"
  // is measured from here, not from the panel: Nick's original spec had it
  // from the panel's own trailing edge, but after seeing it live he wanted
  // the icon to be the thing that reads as "one quarter before the volume,"
  // with the panel free to sit wherever it naturally lands in that gap
  // instead of dictating the gap's size itself. Recomputed from live
  // scrollLeft on every render (see the class doc comment for why).
  const refX = scrollLeft + predictedPillWidthAt(scrollLeft);

  // How much clear space actually separates the icon's edge from a landed
  // volume -- a full pxPerQuarter by default, pulled in by
  // STEPPER_ICON_OVERLAP_PX_BY_ZOOM at zoom levels that want the icon to
  // overlap the preceding quarter gridline instead of stopping exactly on
  // it. Used below in place of a bare pxPerQuarter everywhere the landing
  // clearance itself is what's being expressed.
  const landingClearance = pxPerQuarter - STEPPER_ICON_OVERLAP_PX_BY_ZOOM[zoomLevel];

  // Classification threshold -- NOT refX itself. Landing on a volume always
  // leaves it sitting a full landingClearance ahead of refX, so a volume
  // you've just stepped to is still "ahead of refX" by that same fixed
  // amount -- comparing straight against refX would keep re-offering it as
  // the forward target forever, an apparent no-op click since the
  // recomputed scroll target is identical to where you already are.
  // Comparing against refX + landingClearance instead asks the question
  // that actually matters: would landing on this volume move the scroll
  // position past where it already is? (scrollTargetFor(v) > scrollLeft is
  // the same inequality, worked backward from the landing formula.) A
  // volume you just landed on always lands exactly *on* this threshold, not
  // past it, so it correctly drops out of "ahead" the moment you arrive --
  // the next click advances instead of repeating.
  const forwardThreshold = refX + landingClearance;

  // `volumes` arrives already sorted ascending by start (see App.tsx's
  // entriesByLine builder -- LineRow filters it to volumes-only but doesn't
  // reorder it), so a single forward pass finds both nearest neighbors:
  // backwardTarget keeps getting overwritten by every volume still short of
  // the threshold (so the last write is the closest one behind), while
  // forwardTarget locks in on the first volume past it.
  let backwardTarget: Volume | null = null;
  let forwardTarget: Volume | null = null;
  for (const v of volumes) {
    const x = contentXOf(v);
    if (x < forwardThreshold) {
      backwardTarget = v;
    } else if (x > forwardThreshold && !forwardTarget) {
      forwardTarget = v;
    }
  }

  // The scroll target isn't computable from the panel's CURRENT position --
  // it's a fixed point. The pill's width (hence panelLeft, hence where "one
  // quarter of clearance" actually lands) is itself a function of scrollLeft
  // while the pill is collapsing (see useSidebarPillMetrics), and that
  // collapsing keeps happening for as long as the scroll animation is still
  // short of SIDEBAR_COLLAPSE_RANGE. Using the panel's pre-click position to
  // compute the target (as an earlier version of this did) systematically
  // undershoots near the start of the timeline, where landing anywhere
  // within the collapse range means the REAL panel position at landing time
  // is narrower than what was used to compute the target -- confirmed by
  // reproducing exactly what Nick reported: clicking forward on Superman
  // from the very start of DC Finest took 3 clicks to converge, each one
  // recomputing off the previous (still short) landing's pill width.
  //
  // Solved directly instead of iterating toward it: assume a hypothetical
  // scroll position x, express the pill's width at x as
  // useSidebarPillMetrics does (not hovered -- the cursor is on this panel,
  // a sibling of the pill button, not the button itself, so the pill's own
  // hover state is never engaged by this interaction), and solve
  // `x = target's landing formula, evaluated using the pill's width AT x`
  // for x. That equation is piecewise linear in x (flat below 0, flat above
  // SIDEBAR_COLLAPSE_RANGE, linear between), so it has a closed form in each
  // regime -- no iteration, no risk of it needing a 2nd or 3rd click:
  //   1. If the answer assuming the pill stays fully uncollapsed (x<=0) is
  //      itself <= 0, that's self-consistent -- don't scroll at all.
  //   2. Otherwise, if the answer assuming the pill is already fully
  //      collapsed (x>=SIDEBAR_COLLAPSE_RANGE) is itself >= that range,
  //      that's self-consistent -- this is the common case for anything
  //      that isn't extremely close to the axis start.
  //   3. Otherwise (the fixed point genuinely falls inside the collapsing
  //      range), solve the interior linear equation directly. In practice
  //      this app's constants (icon shrinks by more px than
  //      SIDEBAR_COLLAPSE_RANGE spans) make case 3 unreachable -- included
  //      anyway so this stays correct if those constants ever change instead
  //      of silently reintroducing the multi-click bug for a narrower band
  //      of volumes.
  const scrollTargetFor = (target: Volume): number => {
    const targetLeftContentX = contentXOf(target);
    // No panel width/gap term here -- the clearance is measured to the
    // ICON's own edge (see refX above), and the panel's own footprint plays
    // no part in where that edge needs to land. landingClearance (not a
    // bare pxPerQuarter) so this stays consistent with forwardThreshold's
    // own use of it above.
    const c = targetLeftContentX - landingClearance;

    const ifUncollapsed = c - sidebarWidth;
    if (ifUncollapsed <= 0) return 0;

    const ifFullyCollapsed = c - pillIconSize;
    if (ifFullyCollapsed >= SIDEBAR_COLLAPSE_RANGE) return ifFullyCollapsed;

    const shrinkRange = sidebarWidth - pillIconSize;
    const gain = shrinkRange / SIDEBAR_COLLAPSE_RANGE;
    return Math.max(0, ifUncollapsed / (1 - gain));
  };

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
