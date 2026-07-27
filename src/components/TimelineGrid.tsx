/**
 * Full-height vertical guide lines behind the axis + all line rows (rather
 * than borders scoped to each row/axis cell). White at two opacities: the
 * line marking the start of a year is stronger than the quarter lines
 * within it.
 */
export function TimelineGrid({
  startYear,
  endYear,
  sidebarWidth,
  pxPerQuarter,
  sidebarGap,
}: {
  startYear: number;
  endYear: number;
  sidebarWidth: number;
  pxPerQuarter: number;
  sidebarGap: number;
}) {
  const totalQuarters = (endYear - startYear + 1) * 4;
  const ticks = Array.from({ length: totalQuarters + 1 }, (_, i) => ({
    left: i * pxPerQuarter,
    isYearStart: i % 4 === 0,
  }));

  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-0"
      style={{ left: sidebarWidth + sidebarGap, right: 0 }}
    >
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute inset-y-0 w-px"
          style={{
            left: tick.left,
            backgroundColor: `rgba(255, 255, 255, ${tick.isYearStart ? 0.1 : 0.05})`,
          }}
        />
      ))}
    </div>
  );
}
