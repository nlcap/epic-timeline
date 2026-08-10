import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { Line, Note } from "../types";
import { speculativeTextColor, speculativeTileBackground } from "../lib/color";
import { AXIS_HEIGHT, quartersBetween, type ZoomLevel } from "../lib/timeline";
import { ERA_META, lineIconUrl } from "../lib/era";
import { LineIcon } from "./LineIcon";
import { NAV_HEIGHT } from "./TopNav";
import dragLeftIcon from "../assets/drag_left.svg";
import dragRightIcon from "../assets/drag_right.svg";

// See VolumeTile.tsx's identical constant -- same floating hover preview,
// same clearance math.
const PREVIEW_HEIGHT_ESTIMATE = 160;
const PREVIEW_CLEARANCE = NAV_HEIGHT + AXIS_HEIGHT + PREVIEW_HEIGHT_ESTIMATE;

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

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = useState(false);
  const [flipBelow, setFlipBelow] = useState(false);
  const [previewTop, setPreviewTop] = useState(0);
  const [mouseX, setMouseX] = useState(0);

  const updatePreviewPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const shouldFlipBelow = rect.top < PREVIEW_CLEARANCE;
    setFlipBelow(shouldFlipBelow);
    setPreviewTop(shouldFlipBelow ? rect.bottom : rect.top);
  };

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    updatePreviewPosition();
    setMouseX(e.clientX);
    setHovered(true);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMouseX(e.clientX);
  };

  // See VolumeTile.tsx's identical effect -- keeps the preview from ending
  // up behind the sticky header if the tile scrolls close to it mid-hover.
  useEffect(() => {
    if (!hovered) return;
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        updatePreviewPosition();
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [hovered]);

  const canResize = !locked && !!onResizeStart;

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(false)}
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
      {hovered &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[60] flex w-72 items-start overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 shadow-xl"
            style={{
              left: mouseX,
              top: previewTop,
              transform: flipBelow ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))",
            }}
          >
            {note.coverUrl && (
              <div className="shrink-0 p-2.5">
                <img src={note.coverUrl} alt="" className="w-20" />
              </div>
            )}
            <div className="min-w-0 flex-1 px-3 py-2.5">
              <p className="text-xs font-semibold leading-snug text-white">{note.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">{note.summary}</p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
