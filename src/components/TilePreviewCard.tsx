import { createPortal } from "react-dom";
import type { ReactNode } from "react";

/** Fixed rendered width of the card below (`w-72`) -- exported so callers
 * that need to anchor the card by an edge rather than its cursor-centered
 * default (see useTilePreviewPosition's auto-preview positioning) can
 * convert a target edge into the center-point `left` this component
 * actually expects, without duplicating the Tailwind width as a raw number. */
export const PREVIEW_CARD_WIDTH_PX = 288;

/**
 * Shared floating hover-preview card behind VolumeTile/NoteTile -- a cover
 * image beside title/subtitle text. Portaled straight to document.body:
 * LineRow's own row div always carries a Tailwind translate-y-* class (its
 * enter/exit fade transition), and ANY transform on an ancestor -- even an
 * identity translateY(0) -- makes that ancestor the containing block for
 * descendant `position: fixed` elements per the CSS spec, so without the
 * portal this would render relative to the row, not the viewport, landing
 * far from the cursor.
 *
 * Fixed to the viewport and driven by the cursor's position (`left`/`top`,
 * from useTilePreviewPosition) rather than the tile's own layout position --
 * a tile-relative (e.g. horizontally centered) preview can land off screen
 * for very long volumes even though the cursor itself is on screen. z-[60]
 * clears the sticky nav (z-40) and timeline axis (z-50) so it's never
 * hidden behind them even if it clips one at the edge.
 *
 * `children`, when given, renders below the title/subtitle -- VolumeTile's
 * only use, for its read-only ownership-status row (NoteTile has nothing to
 * add there, since speculative notes don't carry ownership state).
 */
export function TilePreviewCard({
  left,
  top,
  flipBelow,
  coverUrl,
  title,
  subtitle,
  children,
}: {
  left: number;
  top: number;
  flipBelow: boolean;
  coverUrl?: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return createPortal(
    <div
      className="pointer-events-none fixed z-[60] flex w-72 items-start overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 shadow-xl"
      style={{
        left,
        top,
        transform: flipBelow ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))",
      }}
    >
      {coverUrl && (
        <div className="shrink-0 p-2.5">
          <img src={coverUrl} alt="" className="w-20" />
        </div>
      )}
      <div className="min-w-0 flex-1 px-3 py-2.5">
        <p className="text-xs font-semibold leading-snug text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-neutral-400">{subtitle}</p>
        {children}
      </div>
    </div>,
    document.body
  );
}
