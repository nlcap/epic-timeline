import type { Line, Volume } from "../types";
import { OWNED_STATUSES } from "../types";
import {
  ownedTileBorderColor,
  speculativeTextColor,
  speculativeTileBackground,
  tileBackground,
} from "../lib/color";
import { quartersBetween, type ZoomLevel } from "../lib/timeline";
import { volumeBadgeText, volumeIconUrl, volumeNumberLabel, type EraOption } from "../lib/era";
import { OWNERSHIP_META } from "../lib/ownership";
import { DEFAULT_READING_STATUS, READING_STATUS_META } from "../lib/readingStatus";
import { STAR_INDEXES, starIconFor } from "../lib/rating";
import { LineIcon } from "./LineIcon";
import { TileResizeHandles } from "./TileResizeHandles";
import { TilePreviewCard } from "./TilePreviewCard";
import { FlagIcon } from "./icons";
import { useTilePreviewPosition } from "../hooks/useTilePreviewPosition";

export function VolumeTile({
  volume,
  line,
  focused,
  onClick,
  zoomLevel,
  speculative = false,
  locked = false,
  onResizeStart,
  autoPreview = false,
  autoPreviewDelta = 0,
  onHoverStart,
  stepScrolling = false,
  eraOptions,
}: {
  volume: Volume;
  line: Line;
  focused: boolean;
  onClick: () => void;
  zoomLevel: ZoomLevel;
  /** The active collection's era definitions (DC_ERA_OPTIONS, the Custom
   * tab's own user-defined eras, or [] when eras aren't in play) -- see
   * lib/era.ts. Drives the era-letter badge and per-era icon lookup. */
  eraOptions: EraOption[];
  /** Speculation Mode: this volume is speculative -- darkened fill (mixed
   * with black, not opacity-based, so it stays fully opaque), full-opacity
   * line-color border, and title text tinted 50/50 toward white. */
  speculative?: boolean;
  /** Speculation Mode: this is an official (non-speculative) volume while
   * Speculation Mode is on -- reserved styling hook only, no treatment yet. */
  locked?: boolean;
  /** Drag-to-resize: omit to disable the feature entirely (e.g. while
   * locked). Fires on mousedown on either edge handle -- the parent
   * (LineRow's LineTimelineLane) owns the actual drag tracking, since it's
   * the one that knows pxPerQuarter and controls this tile's on-screen
   * position/width. */
  onResizeStart?: (edge: "start" | "end", clientX: number) => void;
  /** Volume stepper (see VolumeStepper.tsx): true the instant a chevron
   * click picks this tile as its target -- pops the hover preview open
   * immediately, as if the cursor were over it, even though it's actually
   * parked on the stepper panel and the tile itself likely hasn't finished
   * scrolling into place yet. See useTilePreviewPosition. */
  autoPreview?: boolean;
  /** Paired with autoPreview: how many px the timeline is about to scroll
   * by, so the preview can be positioned at this tile's FINAL resting spot
   * (current rect minus this delta) instead of its pre-scroll one -- shows
   * instantly, already sitting where the tile is about to glide into,
   * rather than waiting for the scroll to actually get there. See
   * useTilePreviewPosition. */
  autoPreviewDelta?: number;
  /** Fired when a genuine mouse hover of this tile begins -- lets the app
   * retire a lingering stepper auto-preview elsewhere in favour of whatever
   * the user actually moved onto. See useTilePreviewPosition. */
  onHoverStart?: () => void;
  /** True for the duration of a chevron-triggered smooth scroll (see
   * LineRow.tsx) -- suppresses any REAL hover preview this tile would
   * otherwise open from the scroll sweeping it under a stationary cursor,
   * so nothing but the eventual destination's own autoPreview opens during
   * a step. See useTilePreviewPosition. */
  stepScrolling?: boolean;
}) {
  const owned = OWNED_STATUSES.has(volume.ownershipStatus);
  // Speculative fill/border are dialed back to 60%/65% opacity (off the
  // solid speculativeTileBackground mix and the line's raw color,
  // respectively) so a speculative volume reads as less "certain" than an
  // owned/real one.
  const background = speculative
    ? `color-mix(in srgb, ${speculativeTileBackground(line.colorHex)} 60%, transparent)`
    : tileBackground(line.colorHex, owned, focused);
  const speculativeBorderColor = `color-mix(in srgb, ${line.colorHex} 65%, transparent)`;
  const singleQuarter = quartersBetween(volume.start, volume.end) === 0;
  // Zoomed out, the tile has less and less room: level 2 drops the
  // issues-collected subtitle first (icon/badge stay, now visibly
  // overflowing the shorter tile -- see the button's overflow below).
  // Level 3 (16px tall) can't fit the icon or title either, but the badge
  // alone (16px) fits exactly, so it's kept as the only content -- still
  // clickable and still showing its cover preview on hover via the
  // title/handlers below.
  const showSubtitle = zoomLevel === 1;
  const showIcon = zoomLevel !== 3;
  const showTitle = zoomLevel !== 3;
  // Single-quarter volumes at level 1-2 render just the icon/badge with no
  // title span next to it -- the button is a flex row with no
  // justify-content set, so with only one child it was hugging the left
  // edge instead of sitting centered in the pill. Center that case instead
  // of the default (title-trailing) left alignment.
  const hasTitleContent = showTitle && !singleQuarter;
  // Level 3 is always icon/badge-only too (showTitle is false there
  // regardless of singleQuarter), but stays flush left on purpose --
  // unlike the level 1-2 single-quarter case, it's not "centering a lone
  // child that used to sit next to a title," it's the tile's only zoom
  // level short enough that centering would visually disconnect the badge
  // from the tile's left edge (where the equivalent single-quarter tiles
  // at other zoom levels still read as anchored).
  const centerIconOnly = !hasTitleContent && zoomLevel !== 3;
  // Level 1-2: fixed width (era badges are two characters, "G1", so need
  // more room than a plain number) -- it sits under the icon there, so a
  // little uneven side-padding around a short number doesn't stand out.
  // Level 3: the badge IS the whole tile's content (see showIcon/showTitle
  // above), so that same fixed width made a single-digit number look oddly
  // padded next to a wider one -- sized to content plus a small fixed gap
  // instead, era and non-era alike.
  const badgeWidthClass = zoomLevel === 3 ? "px-1" : volume.era ? "w-7" : "w-5";
  const badge = (
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
      {volumeBadgeText(volume, eraOptions)}
    </span>
  );

  // Resize handles need to stay visible while the cursor is over either of
  // them, but they're siblings of the button (not descendants -- nesting
  // an interactive drag handle inside the clickable tile risks the
  // mouseup landing back on the button and firing onClick), positioned at
  // its very edges. So hover tracking lives on the shared wrapping div
  // below instead of the button itself -- otherwise moving from the
  // button onto a handle would fire the button's onMouseLeave and hide
  // the handles out from under the cursor mid-reach.
  const {
    buttonRef,
    hovered,
    previewVisible,
    flipBelow,
    previewTop,
    mouseX,
    handleMouseEnter,
    handleMouseMove,
    handleMouseLeave,
  } = useTilePreviewPosition(autoPreview, stepScrolling, autoPreviewDelta, onHoverStart);

  const tileButton = (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      // No overflow-hidden here on purpose -- at level 2 the icon (40px)
      // is taller than the tile (32px) and is meant to visibly overflow
      // it, matching the sidebar icon's overflow treatment. Horizontal
      // containment still works without it: the title/subtitle below
      // truncate themselves (their own non-visible overflow), which gives
      // them an automatic flex min-width of 0 to shrink into.
      data-official-locked={locked ? "" : undefined}
      className={`group flex h-full w-full items-center gap-1 rounded-full border text-left backdrop-blur-sm transition-colors ${
        hasTitleContent ? "pr-2" : centerIconOnly ? "justify-center" : ""
      }`}
      style={{
        backgroundColor: background,
        // Owned (shelved/ordered) gets a subtle ring tinted with the
        // line's own color (see ownedTileBorderColor) -- on the actual
        // border, not a separate inset box-shadow, so it sits flush with
        // the tile's true edge instead of 1px inside it. Focused/
        // speculative's full-color ring takes priority when present;
        // ownership is still visible then via the tile's own higher fill
        // opacity (see TILE_OPACITY).
        borderColor: speculative
          ? speculativeBorderColor
          : focused
          ? line.colorHex
          : owned
          ? ownedTileBorderColor(line.colorHex)
          : "transparent",
      }}
      title={`${line.name} ${volumeNumberLabel(volume, eraOptions)}: ${volume.title}`}
    >
      {showIcon ? (
        // Level 2 only: width matches the icon's own w-7 (28px) exactly,
        // flush against the tile's left edge (that tile is short enough
        // that the old 40px box's dead space read as misaligned). Level 1
        // (the default view) keeps the original w-10 (40px) box, centering
        // the 28px icon with 6px of breathing room on each side -- there's
        // no cramped-edge problem there, so no reason to lose the spacing.
        // Height stays h-10 either way so the badge still has vertical room
        // to sit below the icon.
        <span
          className={`relative flex h-10 shrink-0 items-center justify-center ${
            zoomLevel === 2 ? "w-7" : "w-10"
          }`}
        >
          <span
            className="mb-2 h-7 w-7 overflow-hidden rounded-full border-2"
            style={{ borderColor: line.colorHex }}
          >
            <LineIcon iconUrl={volumeIconUrl(volume, line, eraOptions)} />
          </span>
          {badge}
        </span>
      ) : (
        badge
      )}
      {hasTitleContent && (
        <span className="min-w-0">
          <span
            className={`block truncate text-sm font-semibold ${speculative ? "" : "text-white"}`}
            style={speculative ? { color: speculativeTextColor(line.colorHex) } : undefined}
          >
            {volume.title}
          </span>
          {showSubtitle && (
            <span className="block truncate text-xs italic text-neutral-300">
              {volume.issuesCollected}
            </span>
          )}
        </span>
      )}
    </button>
  );

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {tileButton}
      <TileResizeHandles
        visible={hovered}
        locked={locked}
        zoomLevel={zoomLevel}
        onResizeStart={onResizeStart}
      />
      {previewVisible && (
        <TilePreviewCard
          left={mouseX}
          top={previewTop}
          flipBelow={flipBelow}
          coverUrl={volume.coverUrl}
          title={volume.title}
          subtitle={volume.issuesCollected}
        >
          {/* Read-only -- same OWNERSHIP_META/READING_STATUS_META icon+label
              pairs (FlagIcon for reading status, matching VolumeDetailPanel's
              own picker) as VolumeDetailPanel's status pickers, just not
              clickable here. Speculative volumes don't track either (see
              VolumeTile's owned styling above, which is a no-op for them
              too), so this is skipped for those the same way the pickers
              are. */}
          {!speculative && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-300">
              <p className="flex items-center gap-1.5">
                <img
                  src={OWNERSHIP_META[volume.ownershipStatus].iconUrl}
                  alt=""
                  className="h-3 w-3 shrink-0"
                />
                {OWNERSHIP_META[volume.ownershipStatus].label}
              </p>
              <p className="flex items-center gap-1.5">
                <FlagIcon
                  className={`h-[9px] w-[9px] shrink-0 ${
                    READING_STATUS_META[volume.readingStatus ?? DEFAULT_READING_STATUS].flagClassName
                  }`}
                />
                {READING_STATUS_META[volume.readingStatus ?? DEFAULT_READING_STATUS].label}
              </p>
            </div>
          )}
          {/* Read-only star rating, below the status row above -- only
            * when the reader has actually set one (undefined for both an
            * unrated volume and, structurally, every speculative one,
            * since App.tsx only ever stamps `rating` onto official
            * resolvedEntries -- see Volume.rating's own doc comment). No
            * separate !speculative check needed the way the row above has
            * one: an unset rating already reads as "nothing to show"
            * regardless of why it's unset. Smaller than the interactive
            * widget's 16px icons (10px here, in scale with this card's
            * other small icons) and fixed at the same 0.8 opacity
            * StarRating settles a saved value at when it's not being
            * actively hovered -- there's no hover state here to justify
            * ever showing 1. */}
          {volume.rating !== undefined && (
            <div className="mt-2 flex items-center gap-0.5">
              {STAR_INDEXES.map((star) => (
                <img
                  key={star}
                  src={starIconFor(volume.rating!, star)}
                  alt=""
                  className="h-2.5 w-2.5"
                  style={{ opacity: volume.rating! >= star - 0.5 ? 0.8 : 0.3 }}
                />
              ))}
            </div>
          )}
        </TilePreviewCard>
      )}
    </div>
  );
}
