import { useEffect, useState } from "react";
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
  /** Speculative volumes don't carry ownership or reading state -- hides
   * both status pickers entirely. */
  speculative?: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = OWNERSHIP_META[status];
  const readingMeta = READING_STATUS_META[readingStatus];
  const { visible, closeThen } = useSlidePanel();

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

  const formattedDescription = formatLineBreaks(volume.description);

  // Credits read as lead-in phrases ("Written by ...") rather than labelled
  // fields, following the "Collects ..." line below the description -- though
  // unlike that line they're set roman, not italic. Either can be missing --
  // the Star Wars sub-lines have neither -- so each renders independently and
  // the block disappears entirely when both are absent.
  const hasCredits = !!(volume.writers || volume.artists);

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
        <div className="relative isolate flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-6">
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

        {volume.coverUrl ? (
          // The cover twice over: a blown-up, heavily blurred copy sitting
          // behind the real one as a wash of the book's own colours -- the
          // product-page treatment. It runs off the top and both sides of the
          // panel (the overhang is wider than the blur radius, so no soft
          // edge creeps back into view) and only resolves at the bottom,
          // where the mask fades it into the panel colour across the gap
          // between the title and the status pills. No object-fit: the copy
          // is stretched to fill the box rather than cropped, which spreads
          // the cover's colours further apart and blurs into a softer wash.
          // -z-10 keeps it behind the text while staying above the panel's
          // own background.
          // -z-10 on the whole cover group so it paints before the panel's
          // in-flow text: wrapping the cover in a positioned element had put
          // it in the positioned-paint pass, which draws after in-flow
          // content, so its shadow was falling across the title below it.
          <div className="relative -z-10 mt-4">
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
             * that pushes past the edges so the cover lifts off the wash. */}
            <img
              src={volume.coverUrl}
              alt=""
              className="mx-auto h-auto w-full max-w-[75%] rounded-md shadow-[0_24px_80px_-40px_rgba(0,0,0,0.5),0_32px_90px_24px_rgba(0,0,0,0.35)]"
            />
          </div>
        ) : (
          <div className="mt-4 flex h-64 w-full items-center justify-center rounded-md bg-neutral-800 text-sm text-neutral-500">
            Cover image
          </div>
        )}

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

        {hasCredits && (
          <div className="mt-4 text-sm text-neutral-400">
            {volume.writers && <p>Written by {volume.writers}</p>}
            {volume.artists && <p>Art by {volume.artists}</p>}
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

        <p className="mt-3 text-sm italic text-neutral-400">
          Collects {volume.issuesCollected}.
        </p>

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
