import type { Line, Note } from "../types";
import { speculativeTextColor, speculativeTileBackground } from "../lib/color";
import { quartersBetween, type ZoomLevel } from "../lib/timeline";
import { ERA_META, lineIconUrl } from "../lib/era";
import { LineIcon } from "./LineIcon";
import { TileResizeHandles } from "./TileResizeHandles";
import { TilePreviewCard } from "./TilePreviewCard";
import { useTilePreviewPosition } from "../hooks/useTilePreviewPosition";

/**
 * Speculation Mode's "New Note" entry, in place of a volume. Modeled on
 * VolumeTile -- same layout, hover preview, and drag-to-resize handles --
 * but always styled like a speculative volume (notes only ever exist on the
 * speculative layer), at half that fill's opacity, and with a 4px `rounded`
 * corner radius instead of VolumeTile's fully-rounded pill, so a note reads
 * as a distinct, lighter-weight shape on the timeline. No ownership styling
 * (notes don't carry ownership state)
 * and the number badge is only shown when a number was actually entered --
 * unlike a volume's, a note's number is optional.
 */
export function NoteTile({
  note,
  line,
  onClick,
  zoomLevel,
  locked = false,
  onResizeStart,
  onHoverStart,
  stepScrolling = false,
}: {
  note: Note;
  line: Line;
  onClick: () => void;
  zoomLevel: ZoomLevel;
  /** Speculation Mode: this is an official (non-speculative) line while
   * Speculation Mode is on -- hides the resize handles, same as
   * VolumeTile/GapSegment's locked. */
  locked?: boolean;
  onResizeStart?: (edge: "start" | "end", clientX: number) => void;
  /** Fired when a genuine mouse hover of this tile begins -- lets the app
   * retire a lingering stepper auto-preview elsewhere in favour of whatever
   * the user actually moved onto. See useTilePreviewPosition. */
  onHoverStart?: () => void;
  /** True for the duration of a chevron-triggered smooth scroll (see
   * LineRow.tsx) -- suppresses any REAL hover preview this tile would
   * otherwise open from the scroll sweeping it under a stationary cursor.
   * See useTilePreviewPosition. */
  stepScrolling?: boolean;
}) {
  // 40% as opaque as a speculative volume's tile fill (see
  // speculativeTileBackground), and an 85%-opacity border, so a note reads
  // as lighter-weight than a real speculative volume on the timeline.
  const background = `color-mix(in srgb, ${speculativeTileBackground(line.colorHex)} 40%, transparent)`;
  const borderColor = `color-mix(in srgb, ${line.colorHex} 85%, transparent)`;
  const textColor = speculativeTextColor(line.colorHex);
  const singleQuarter = quartersBetween(note.start, note.end) === 0;
  const showSubtitle = zoomLevel === 1;
  const showIcon = zoomLevel !== 3;
  const showTitle = zoomLevel !== 3;
  const hasTitleContent = showTitle && !singleQuarter;
  const centerIconOnly = !hasTitleContent && zoomLevel !== 3;
  const trimmedNumber = note.number.trim();
  const badgeText = trimmedNumber
    ? note.era
      ? `${ERA_META[note.era].letter}${trimmedNumber}`
      : trimmedNumber
    : undefined;
  const badgeWidthClass = zoomLevel === 3 ? "px-1" : note.era ? "w-7" : "w-5";
  const badge = badgeText ? (
    <span
      className={`flex h-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold leading-none text-white ${badgeWidthClass} ${
        showIcon ? "absolute bottom-0.5 left-1/2 -translate-x-1/2" : ""
      }`}
      style={{
        backgroundColor: line.colorHex,
        WebkitTextStroke: "1px rgba(0,0,0,0.7)",
        paintOrder: "stroke fill",
      }}
    >
      {badgeText}
    </span>
  ) : null;
  const iconUrl = (note.era && line.eraIconUrls?.[note.era]) ?? lineIconUrl(line);

  const { buttonRef, hovered, flipBelow, previewTop, mouseX, handleMouseEnter, handleMouseMove, handleMouseLeave } =
    useTilePreviewPosition(false, stepScrolling, 0, onHoverStart);

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        data-official-locked={locked ? "" : undefined}
        className={`group flex h-full w-full items-center gap-1 rounded border text-left backdrop-blur-sm transition-colors ${
          hasTitleContent ? "pr-2" : centerIconOnly ? "justify-center" : ""
        }`}
        style={{ backgroundColor: background, borderColor }}
        title={`${line.name} Note: ${note.title}`}
      >
        {showIcon ? (
          <span
            className={`relative flex h-10 shrink-0 items-center justify-center ${
              zoomLevel === 2 ? "w-7" : "w-10"
            }`}
          >
            <span
              className="mb-2 h-7 w-7 overflow-hidden rounded-full border-2"
              style={{ borderColor: line.colorHex }}
            >
              <LineIcon iconUrl={iconUrl} />
            </span>
            {badge}
          </span>
        ) : (
          badge
        )}
        {hasTitleContent && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold" style={{ color: textColor }}>
              {note.title}
            </span>
            {showSubtitle && (
              <span className="block truncate text-xs italic text-neutral-300">
                {note.summary}
              </span>
            )}
          </span>
        )}
      </button>
      <TileResizeHandles
        visible={hovered}
        locked={locked}
        zoomLevel={zoomLevel}
        onResizeStart={onResizeStart}
      />
      {hovered && (
        <TilePreviewCard
          left={mouseX}
          top={previewTop}
          flipBelow={flipBelow}
          coverUrl={note.coverUrl}
          title={note.title}
          subtitle={note.summary}
        />
      )}
    </div>
  );
}
