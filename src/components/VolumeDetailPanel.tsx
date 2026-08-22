import { useEffect, useRef, useState } from "react";
import type { OwnershipStatus, ReadingStatus, Volume } from "../types";
import { OWNERSHIP_META, OWNERSHIP_ORDER } from "../lib/ownership";
import { READING_STATUS_META, READING_STATUS_ORDER } from "../lib/readingStatus";
import { volumeBadgeText } from "../lib/era";
import { formatMonthPoint, isFutureMonth } from "../lib/timeline";
import { formatLineBreaks } from "../lib/text";
import { isTypingTarget } from "../lib/keyboard";
import { useSlidePanel } from "../hooks/useSlidePanel";
import { useEscapeToClose } from "../hooks/useEscapeToClose";
import { StatusDropdown } from "./StatusDropdown";

export function VolumeDetailPanel({
  volume,
  status,
  onStatusChange,
  readingStatus,
  onReadingStatusChange,
  onEdit,
  onDelete,
  onClose,
  onStepBackward,
  onStepForward,
  onStepUp,
  onStepDown,
  speculative = false,
}: {
  volume: Volume;
  status: OwnershipStatus;
  onStatusChange: (status: OwnershipStatus) => void;
  readingStatus: ReadingStatus;
  onReadingStatusChange: (status: ReadingStatus) => void;
  onEdit?: (volume: Volume) => void;
  onDelete?: (volumeId: string) => void;
  onClose: () => void;
  /** Volume stepper (see VolumeStepper.tsx): steps to the previous/next
   * volume on this volume's line, same target selection and timeline scroll
   * as the sidebar chevrons, except the panel stays open on whatever it
   * lands on instead of closing -- so App.tsx wires these straight to
   * setSelectedVolumeId plus the scroll, never through the sidebar
   * stepper's own hover-preview path (there's no need to stand in for a
   * hover when the panel's already showing everything that preview would).
   * `undefined` when there's no volume in that direction -- the chevron
   * button is always rendered (same as the sidebar stepper's own chevrons)
   * but disabled, not hidden, so the control's position stays stable. */
  onStepBackward?: () => void;
  onStepForward?: () => void;
  /** Volume stepper, vertical (see App.tsx's handlePanelVerticalStep):
   * moves to the nearest volume (by start quarter) on the line immediately
   * above/below this one's, in the sidebar's own rendered order -- not a
   * chevron-driven control (no button, no disabled state to render), just
   * a keyboard shortcut. Always a real no-op-internally function rather
   * than `undefined` at a boundary, unlike onStepBackward/onStepForward
   * above -- there's no button state that needs to know the difference,
   * so the "nothing above/below, or that line has no volumes" case is
   * just handled inside App.tsx's handler instead of surfaced here. */
  onStepUp?: () => void;
  onStepDown?: () => void;
  /** Speculative volumes don't carry ownership or reading state -- hides
   * both status pickers entirely. */
  speculative?: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = OWNERSHIP_META[status];
  const readingMeta = READING_STATUS_META[readingStatus];
  const { visible, closeThen } = useSlidePanel();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Moves focus into the panel's own scroller the instant it opens, off
  // whatever timeline tile was just clicked to open it -- without this,
  // that tile stays focused (clicking a button focuses it in every browser
  // but Safari), and Space's own guard against hijacking a focused
  // button's native activation (see below) reads THAT stale focus and
  // treats every press as "let the button handle it," never touching the
  // panel at all. Reported by Nick as having to click inside the panel
  // first before Space would do anything. `tabIndex={-1}` on the scroller
  // below makes it focusable via script without joining the normal Tab
  // order; `preventScroll` stops the focus call itself from being treated
  // as a scroll-into-view. Empty deps: this component remounts fresh each
  // time the panel opens (see App.tsx's `{selectedVolume && ... && (...)}`
  // conditional), so a run-once effect is exactly "on open," and stepping
  // to a different volume afterward never needs to re-run it -- nothing
  // during a keyboard-driven step ever moves focus away in the first place.
  useEffect(() => {
    scrollRef.current?.focus({ preventScroll: true });
  }, []);

  useEscapeToClose(closeThen, onClose);

  // "e" opens Edit Volume, same as clicking the button -- only wired up
  // when onEdit is actually provided (matching the button's own conditional
  // rendering above), and skipped while a status dropdown or anything else
  // in here might plausibly have focus in a way that makes "e" ambiguous.
  useEffect(() => {
    if (!onEdit) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "e" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      closeThen(() => onEdit(volume));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEdit, volume, closeThen]);

  // Left/Right arrows, ,/< and ./>, step to the previous/next volume on
  // this line -- the same target and timeline scroll the panel's own
  // stepper chevrons trigger (see onStepBackward/onStepForward above), just
  // from the keyboard. ,/< and ./> mirror the chevrons' own left/right
  // layout as a second pair, the same convention Photos/Slides/etc. use to
  // step through a series, so it doesn't have to fight the arrow keys for
  // muscle memory from those. Bails per-direction when that direction has
  // no handler -- the line's boundary there, same as the chevron rendering
  // disabled -- rather than doing whatever the key would otherwise do.
  //
  // Up/Down move to the nearest volume on the line above/below instead --
  // see handlePanelVerticalStep in App.tsx for what "nearest" means and
  // why there's no visible control for it. Unlike the four keys above,
  // onStepUp/onStepDown are always real functions (never undefined at a
  // boundary -- see their own doc comment), so there's nothing to bail on
  // here beyond the shared guards; "nothing above/below" is handled inside
  // that function, not by this one skipping the call.
  useEffect(() => {
    if (!onStepBackward && !onStepForward && !onStepUp && !onStepDown) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      switch (e.key) {
        case "ArrowLeft":
        case ",":
        case "<":
          if (!onStepBackward) return;
          e.preventDefault();
          onStepBackward();
          break;
        case "ArrowRight":
        case ".":
        case ">":
          if (!onStepForward) return;
          e.preventDefault();
          onStepForward();
          break;
        case "ArrowUp":
          if (!onStepUp) return;
          e.preventDefault();
          onStepUp();
          break;
        case "ArrowDown":
          if (!onStepDown) return;
          e.preventDefault();
          onStepDown();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onStepBackward, onStepForward, onStepUp, onStepDown]);

  // Space pages the panel's own scroller down by about half its own visible
  // height -- a reader's "more," not a full page-worth, so the tail of what
  // was already on screen carries over as context for what's new. Once
  // there's nothing left to page to (within a couple px -- scrollHeight/
  // scrollTop can both be fractional and rarely land on an exact integer
  // match), the next press wraps back to the top instead of just sitting
  // inert at the bottom, so Space alone can cycle the whole panel
  // repeatedly with no other key needed.
  //
  // Skipped when the event target is itself a button (StatusDropdown's
  // trigger, Edit/Delete/confirm) -- Space is that element's own native
  // activation key there, and hijacking it here would silence a focused
  // button's click in favor of scrolling out from under it.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== " " || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.tagName === "BUTTON") return;
      const el = scrollRef.current;
      if (!el) return;
      e.preventDefault();
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      el.scrollTo({
        top: atBottom ? 0 : el.scrollTop + el.clientHeight / 2,
        behavior: "smooth",
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const formattedDescription = formatLineBreaks(volume.description);

  // Credits read as lead-in phrases ("Written by ...") rather than labelled
  // fields, following the "Collects ..." line below the description -- though
  // unlike that line they're set roman, not italic. Any of the three can be
  // missing -- the Star Wars sub-lines have none, and only volumes rebuilt
  // from issue-by-issue research carry inkers -- so each renders
  // independently and the block disappears entirely when all are absent.
  const hasCredits = !!(volume.writers || volume.pencillers || volume.inkers);

  return (
    <div
      className={`fixed inset-0 z-[65] flex justify-end bg-black/60 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => closeThen(onClose)}
    >
      <div
        className={`relative flex h-full w-full max-w-sm flex-col overflow-hidden border-l border-neutral-800 bg-[#252526]/35 backdrop-blur-sm transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel colour, deepening downwards -- what the cover wash below
         * fades out into. A darker grey than the panel's own #252526 so the
         * scrim reads as shadow rather than more panel, at alphas low enough
         * to leave the timeline faintly visible through it. Sits outside the
         * scroller so it stays put. Written out as a gradient rather than
         * from-/via-/to- utilities because Tailwind drops the via and to
         * stops when the colour is arbitrary and carries an opacity
         * modifier, leaving a fade to transparent. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(26,26,27,0.55) 0%, rgba(26,26,27,0.86) 50%, rgba(26,26,27,0.93) 100%)",
          }}
        />

        {/* isolate keeps the wash's -z-10 inside this scroller, above the
         * gradient behind it rather than underneath. */}
        <div
          ref={scrollRef}
          tabIndex={-1}
          // Focusable via the effect above, not Tab -- outline-none since a
          // default focus ring around the whole scroller reads as a stray
          // rectangle around the panel's content, not a real interactive
          // control a sighted user would expect to see highlighted.
          className="relative isolate flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-6 outline-none"
        >
        <div className="flex items-center">
          {onEdit && (
            <button
              type="button"
              onClick={() => closeThen(() => onEdit(volume))}
              className="flex items-center justify-center gap-2 rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium text-white hover:border-neutral-500"
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
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit Volume
            </button>
          )}
          <button
            type="button"
            onClick={() => closeThen(onClose)}
            className="ml-auto text-sm text-neutral-400 hover:text-white"
          >
            Close ✕
          </button>
        </div>

        {/* Common wrapper for the cover (or its placeholder) AND the stepper
         * chevrons below. Unlike the cover group's own -z-10 (see below),
         * this outer div stays at the default stacking level so the
         * chevrons -- explicit z-10 siblings of that group -- paint above
         * the cover/wash regardless. */}
        <div className="relative mt-4">
          {/* Sizing spacer: invisible (not display:none) but still in
           * normal flow, so it -- not whichever branch below actually
           * renders -- is what gives this wrapper its height. Real covers'
           * own intrinsic ratios vary slightly around the 0.65 average
           * (780x1200 exactly, but a live Amazon/PRH fetch can land at
           * 0.648 or 0.651), which used to size this box directly and,
           * with it, the chevrons' top-1/2 vertical center -- shifting
           * them a couple px between volumes, reported by Nick as the
           * buttons visibly jittering while stepping through a line.
           * Pinning height to this one constant instead of each cover's
           * own means every volume -- covered or not -- gets pixel-
           * identical chevron positions. */}
          <div aria-hidden className="invisible mx-auto aspect-[13/20] w-full max-w-[75%]" />
          {volume.coverUrl ? (
            // The cover twice over: a blown-up, heavily blurred copy sitting
            // behind the real one as a wash of the book's own colours -- the
            // product-page treatment. It runs off the top and both sides of
            // the panel (the overhang is wider than the blur radius, so no
            // soft edge creeps back into view) and only resolves at the
            // bottom, where the mask fades it into the panel colour across
            // the gap between the title and the status pills. No
            // object-fit on the wash -- the copy is stretched to fill the
            // box rather than cropped, which spreads the cover's colours
            // further apart and blurs into a softer wash. -z-10 keeps it
            // behind the text while staying above the panel's own
            // background.
            // absolute inset-0 (not the spacer's in-flow sizing) so this
            // group fills the exact box the spacer measured out, instead
            // of sizing itself from the real image's own slightly
            // different intrinsic ratio -- see the spacer's own comment.
            // -z-10 on the whole cover group so it paints before the
            // panel's in-flow text: wrapping the cover in a positioned
            // element had put it in the positioned-paint pass, which draws
            // after in-flow content, so its shadow was falling across the
            // title below it.
            <div className="absolute inset-0 -z-10">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[-72px] -top-48 bottom-[-130px] -z-10"
              >
                <img
                  src={volume.coverUrl}
                  alt=""
                  className="h-full w-full opacity-30 blur-3xl"
                  style={{
                    maskImage:
                      "linear-gradient(to bottom, #000 0, #000 calc(100% - 114px), transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, #000 0, #000 calc(100% - 114px), transparent 100%)",
                  }}
                />
              </div>
              {/* Two shadows: a deep one pulled back in under the cover by its
               * negative spread, and a lighter, wider one with positive spread
               * that pushes past the edges so the cover lifts off the wash.
               * object-cover (not the old h-auto) crops the sliver either
               * side of a cover whose own ratio doesn't land on exactly
               * 0.65 -- imperceptible at this margin, and the price of
               * filling a box whose height no longer bends to match it. */}
              <img
                src={volume.coverUrl}
                alt=""
                className="mx-auto h-full w-full max-w-[75%] rounded-md object-cover shadow-[0_24px_80px_-40px_rgba(0,0,0,0.5),0_32px_90px_24px_rgba(0,0,0,0.35)]"
              />
            </div>
          ) : (
            // absolute inset-0, matching the cover branch above, so both
            // fill the exact same spacer-defined box -- see its comment.
            <div className="absolute inset-0 mx-auto flex w-full max-w-[75%] items-center justify-center rounded-md bg-neutral-800 text-sm text-neutral-500">
              Cover image
            </div>
          )}
          {/* Stepper chevrons: outside the cover itself (left-0/right-0 sit
           * in the margin either side of the image's own max-w-[75%],
           * centered), lined up with the panel's own content bounds rather
           * than overlapping the artwork -- and vertically centered on the
           * spacer's fixed box above, not whichever branch actually
           * rendered, so they land in the same spot regardless of a real
           * cover's own slightly-off ratio (see the spacer's comment).
           * Always rendered, disabled (not hidden) when there's no volume
           * in that direction, matching the sidebar stepper's own chevrons
           * in VolumeStepper.tsx. */}
          <button
            type="button"
            onClick={onStepBackward}
            disabled={!onStepBackward}
            aria-label="Previous volume"
            className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors enabled:hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onStepForward}
            disabled={!onStepForward}
            aria-label="Next volume"
            className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors enabled:hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <h2 className="mt-4 text-xl font-bold text-white">{volume.title}</h2>
        <p className="text-sm italic text-neutral-300">
          Vol. {volumeBadgeText(volume)}, {volume.yearsCovered}
        </p>
        {volume.releaseDate && (
          <p className="mt-1 text-xs text-neutral-400">
            {isFutureMonth(volume.releaseDate) ? "Releases" : "Released"}{" "}
            {formatMonthPoint(volume.releaseDate)}
          </p>
        )}
        {!speculative && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusDropdown
              icon={<img src={meta.iconUrl} alt="" className="h-3 w-3" />}
              label={meta.label}
              onSelect={onStatusChange}
              options={OWNERSHIP_ORDER.map((s) => ({
                value: s,
                label: OWNERSHIP_META[s].label,
                icon: <img src={OWNERSHIP_META[s].iconUrl} alt="" className="h-3 w-3" />,
              }))}
            />
            <StatusDropdown
              icon={<span className={`h-2.5 w-2.5 rounded-full ${readingMeta.dotClassName}`} />}
              label={readingMeta.label}
              onSelect={onReadingStatusChange}
              options={READING_STATUS_ORDER.map((s) => ({
                value: s,
                label: READING_STATUS_META[s].label,
                icon: (
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${READING_STATUS_META[s].dotClassName}`}
                  />
                ),
              }))}
            />
          </div>
        )}

        <div className="mt-4 text-sm leading-relaxed text-neutral-200">
          {formattedDescription.split("\n").map((paragraph, i) => (
            // Each Enter press in the editor's textarea is one paragraph
            // (see the "Press Enter for a paragraph break" hint in
            // VolumeFormDrawer) -- rendering them as separate <p>s instead
            // of one whitespace-pre-line block lets each get its own
            // bottom spacing rather than just the font's line-height gap.
            <p key={i} className="pb-2 last:pb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {hasCredits && (
          <div className="mt-4 flex flex-col gap-1 text-sm text-neutral-400">
            {volume.writers && (
              <p>
                <span className="font-semibold text-neutral-300">Written by</span> {volume.writers}
              </p>
            )}
            {volume.pencillers && (
              <p>
                {/* "Art by" covers two cases: a volume we haven't split by role
                 * yet, and one where the same people pencilled and inked
                 * throughout -- true of the Golden Age books, where printing
                 * the identical list twice would just be noise. */}
                <span className="font-semibold text-neutral-300">
                  {volume.inkers && volume.inkers !== volume.pencillers ? "Pencils by" : "Art by"}
                </span>{" "}
                {volume.pencillers}
              </p>
            )}
            {volume.inkers && volume.inkers !== volume.pencillers && (
              <p>
                <span className="font-semibold text-neutral-300">Inks by</span> {volume.inkers}
              </p>
            )}
          </div>
        )}

        <p className="mt-3 text-sm italic text-neutral-400">
          Collects {volume.issuesCollected}.
        </p>

        {volume.coverUrl && (
          <p className="mt-3 text-xs text-neutral-500">
            Cover art &copy; its respective publisher, used for reference only.
          </p>
        )}

        {onDelete && (
          <div className="mt-6">
            {confirmingDelete ? (
              <div className="rounded-md border border-red-900 bg-red-950/40 p-4">
                <p className="text-sm text-red-200">
                  Are you sure you want to delete "{volume.title}"? This can't be undone.
                </p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => closeThen(() => onDelete(volume.id))}
                    className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Yes, delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full rounded-md border border-transparent px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300"
              >
                Delete Volume
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
