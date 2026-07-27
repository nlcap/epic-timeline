import { AXIS_HEIGHT, yearRange, type ZoomLevel } from "../lib/timeline";

export function TimelineAxis({
  startYear,
  endYear,
  pxPerQuarter,
  zoomLevel,
}: {
  startYear: number;
  endYear: number;
  pxPerQuarter: number;
  zoomLevel: ZoomLevel;
}) {
  const years = yearRange(startYear, endYear);
  // Level 3's year columns are much narrower (see PX_PER_QUARTER_BY_ZOOM),
  // so the default text-lg/pl-2 (18px text, 28px line-height, 8px padding)
  // would crowd or overflow them. Scaled down to the requested 0.625rem
  // (10px) font, with line-height and padding brought down by roughly the
  // same ratio (~0.56x) rather than left at their level-1/2 size: leading-4
  // (16px) keeps close to the original font-size:line-height ratio, and
  // pl-1 (4px) is 8px x 0.56 rounded to the nearest Tailwind step.
  const yearClassName =
    zoomLevel === 3
      ? "tabular-nums-axis pl-1 font-display font-bold text-[0.625rem] leading-4 text-neutral-400"
      : "tabular-nums-axis pl-1 font-display font-bold text-lg text-neutral-400";
  return (
    <div className="flex" style={{ height: AXIS_HEIGHT }}>
      {years.map((year) => (
        <div
          key={year}
          className="flex shrink-0 items-center"
          style={{ width: pxPerQuarter * 4, height: AXIS_HEIGHT }}
        >
          <span className={yearClassName}>{year}</span>
        </div>
      ))}
    </div>
  );
}
