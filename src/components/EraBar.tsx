import { ERA_BAR_COLOR, ERA_META, eraSegmentsForQuarterRange } from "../lib/era";
import { quarterIndex } from "../lib/timeline";

export const ERA_BAR_HEIGHT = 12;
// How short the bar gets once fully scroll-collapsed -- stays a visible
// sliver of color rather than disappearing entirely.
export const ERA_BAR_COLLAPSED_HEIGHT = 2;

/**
 * DC Finest-only row above the year axis marking the shared-continuity eras
 * (Golden/Silver/Bronze/Post-Crisis) as colored segments with an integrated
 * label. Once the axis sticks to the top of the viewport on scroll, the bar
 * height eases down to ERA_BAR_COLLAPSED_HEIGHT and the label fades out --
 * `collapseProgress` (0-1) drives both, continuous like the sidebar pill's
 * horizontal scroll-collapse (see useSidebarPillMetrics).
 */
export function EraBar({
  startYear,
  endYear,
  pxPerQuarter,
  collapseProgress,
}: {
  startYear: number;
  endYear: number;
  pxPerQuarter: number;
  collapseProgress: number;
}) {
  // Quarter-precision (not just whole years) so a boundary like "Q4 1986"
  // lands on the right quarter line rather than snapping to the year.
  const startQuarter = quarterIndex({ year: startYear, quarter: 1 });
  const endQuarter = quarterIndex({ year: endYear, quarter: 4 });
  const segments = eraSegmentsForQuarterRange(startQuarter, endQuarter);
  const barHeight =
    ERA_BAR_HEIGHT - collapseProgress * (ERA_BAR_HEIGHT - ERA_BAR_COLLAPSED_HEIGHT);
  const labelOpacity = 1 - collapseProgress;
  // Absolutely positioned (rather than a plain flex row) so each segment can
  // be inset by 1px on the right -- the same "left+1, width-1" trick
  // VolumeTile's entries use for the 1px gap between tiles -- leaving a 1px
  // seam at the quarter line between eras instead of the bars touching.
  let cursor = 0;
  return (
    <div
      className="relative transition-[height] duration-150 ease-out"
      style={{ height: barHeight }}
    >
      {segments.map((segment) => {
        const left = cursor;
        const width = (segment.endQuarter - segment.startQuarter + 1) * pxPerQuarter;
        cursor += width;
        return (
          <div
            key={segment.era}
            className="absolute inset-y-0 flex items-center overflow-hidden rounded-[2px]"
            style={{
              left,
              width: Math.max(width - 1, 0),
              backgroundColor: ERA_BAR_COLOR[segment.era],
            }}
          >
            <span
              className="whitespace-nowrap ml-4 rounded-[2px] px-1.5 font-display text-[15.5px] font-semibold uppercase leading-none tracking-wide transition-opacity duration-150 ease-out"
              style={{
                backgroundColor: "#1E1E1E",
                color: ERA_BAR_COLOR[segment.era],
                opacity: labelOpacity,
              }}
            >
              {ERA_META[segment.era].label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
