import { useState } from "react";
import type { Gap, Line } from "../types";
import { hexToRgba } from "../lib/color";
import type { ZoomLevel } from "../lib/timeline";
import dragLeftIcon from "../assets/drag_left.svg";
import dragRightIcon from "../assets/drag_right.svg";

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
 * pre-filled for editing. Drag-to-resize works the same way as VolumeTile's
 * too -- same hover-revealed edge handles, same icons/cursor/mechanics --
 * since a gap's start/end are timeline data exactly like a volume's, just
 * rendered differently.
 */
export function GapSegment({
  gap,
  line,
  zoomLevel,
  locked = false,
  onClick,
  onResizeStart,
}: {
  gap: Gap;
  line: Line;
  zoomLevel: ZoomLevel;
  /** Speculation Mode: this gap belongs to a locked official line -- hides
   * the resize handles the same way VolumeTile's locked does. */
  locked?: boolean;
  onClick: () => void;
  /** Drag-to-resize: omit to disable the feature entirely (e.g. while
   * locked). Fires on mousedown on either edge handle -- see VolumeTile.tsx,
   * whose parent (LineRow's LineTimelineLane) owns the actual drag tracking
   * for both tile kinds identically. */
  onResizeStart?: (edge: "start" | "end", clientX: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const canResize = !locked && !!onResizeStart;

  const content =
    gap.gapType === "publication" ? (
      <button
        type="button"
        onClick={onClick}
        className="h-full w-full cursor-pointer rounded-full blur-[8px]"
        style={{ backgroundColor: hexToRgba(line.colorHex, 0.1) }}
        title={gap.label ?? "No issues published in this window"}
      />
    ) : (
      // uncollected -- placeholder treatment, revisit design later
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full cursor-pointer items-center justify-center rounded-full border border-dashed border-neutral-600 text-[10px] uppercase tracking-wide text-neutral-500"
        title={gap.label ?? "Not yet collected -- treatment TBD"}
      >
        TBD
      </button>
    );

  // No hover-preview card here (gaps don't have cover/title/ownership data
  // to show), so unlike VolumeTile this doesn't need the wrapping div's
  // mousemove tracking or a portal -- just hover state to reveal the
  // handles, same as everything else about them.
  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {content}
      {canResize && hovered && (
        <>
          <div
            className="absolute inset-y-0 left-1 z-10 flex w-3 cursor-ew-resize select-none items-center justify-center"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResizeStart!("start", e.clientX);
            }}
          >
            <img
              src={dragLeftIcon}
              alt=""
              draggable={false}
              className={`pointer-events-none w-auto select-none ${zoomLevel === 3 ? "h-2.5" : "h-4"}`}
            />
          </div>
          <div
            className="absolute inset-y-0 right-1 z-10 flex w-3 cursor-ew-resize select-none items-center justify-center"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResizeStart!("end", e.clientX);
            }}
          >
            <img
              src={dragRightIcon}
              alt=""
              draggable={false}
              className={`pointer-events-none w-auto select-none ${zoomLevel === 3 ? "h-2.5" : "h-4"}`}
            />
          </div>
        </>
      )}
    </div>
  );
}
