import type { Gap, Line } from "../types";
import { hexToRgba } from "../lib/color";

/**
 * Two gap types, two treatments:
 *  - "publication": no comics existed in this window -- nothing will ever be
 *    added here. Rendered as a soft, blurred wash of the line color.
 *  - "uncollected": comics exist but haven't been reprinted into a volume
 *    yet -- a volume could show up here someday. Visual treatment is still
 *    TBD, so this renders as an explicit placeholder for now rather than
 *    reusing the "gone for good" treatment.
 *
 * Clickable (like a VolumeTile) to open the same drawer used to add gaps,
 * pre-filled for editing.
 */
export function GapSegment({
  gap,
  line,
  onClick,
}: {
  gap: Gap;
  line: Line;
  onClick: () => void;
}) {
  if (gap.gapType === "publication") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="h-full w-full cursor-pointer rounded-full blur-[8px]"
        style={{ backgroundColor: hexToRgba(line.colorHex, 0.1) }}
        title={gap.label ?? "No issues published in this window"}
      />
    );
  }

  // uncollected -- placeholder treatment, revisit design later
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full w-full cursor-pointer items-center justify-center rounded-full border border-dashed border-neutral-600 text-[10px] uppercase tracking-wide text-neutral-500"
      title={gap.label ?? "Not yet collected -- treatment TBD"}
    >
      TBD
    </button>
  );
}
