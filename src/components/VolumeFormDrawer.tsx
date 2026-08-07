import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Era, OwnershipStatus, Quarter, QuarterPoint, TimelineEntry } from "../types";
import { OWNERSHIP_META, OWNERSHIP_ORDER } from "../lib/ownership";
import { eraForQuarterPoint, ERA_META, ERA_ORDER } from "../lib/era";
import { quarterIndex, quarterPointFromIndex, yearsCoveredLabel } from "../lib/timeline";
import { compressImageFile, getPastedImageFile } from "../lib/imageCompression";
import { useSlidePanel } from "../hooks/useSlidePanel";

const QUARTERS: Quarter[] = [1, 2, 3, 4];

function formatQuarterPoint(p: QuarterPoint): string {
  return `Q${p.quarter} ${p.year}`;
}

/**
 * Hover-revealed reset control for an uploaded cover image -- darkened scrim
 * + trash icon over the image itself, click resets to the empty (no cover)
 * state. A sibling of the <img>, not a descendant of an upload-triggering
 * <label>, so clicking it doesn't also open the file picker. Mirrors
 * LineFormDrawer's IconResetOverlay.
 */
function ImageResetOverlay({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      aria-label="Reset cover image"
      className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    </button>
  );
}

export function VolumeFormDrawer({
  lineId,
  supportsEra = false,
  supportsSwimLanePosition = false,
  lineSwimLanes = 1,
  editingEntry,
  speculative = false,
  defaultStart,
  onSave,
  onDelete,
  onClose,
}: {
  lineId: string;
  /** DC Finest: volumes carry an era + era-relative number ("G1", "Sa")
   * instead of a plain sequential number. Every other collection omits this. */
  supportsEra?: boolean;
  /** Licensed-collection-only, same gate as the Line form's "Swim lanes"
   * field -- shows the "Swim lane position" field below. */
  supportsSwimLanePosition?: boolean;
  /** This volume's line's current swim-lane count (see Line.swimLanes) --
   * drives the "Swim lane position" dropdown's option range, and disables
   * it outright at 1 (nothing to pin against). */
  lineSwimLanes?: number;
  /** Omit to add a new entry; pass an existing volume or gap to edit it. */
  editingEntry?: TimelineEntry;
  /** Speculation Mode: this entry belongs to a speculative line. Relabels
   * "Volume" to "Speculation" throughout and hides the ownership-status
   * field -- speculative volumes don't carry ownership state. */
  speculative?: boolean;
  /** Pre-fills the start year/quarter fields when adding a new entry --
   * used by the timeline's per-quarter "add volume" hover shortcut, which
   * knows exactly which quarter was clicked. Also pre-fills end to the
   * quarter right after it (see defaultEnd below), rather than leaving end
   * blank -- most volumes span more than a single quarter, so defaulting
   * end to equal start (or leaving it empty) just made every quick-add
   * volume need a manual end edit. Ignored when editingEntry is set (its
   * own start/end already govern those fields). */
  defaultStart?: QuarterPoint;
  onSave: (entry: TimelineEntry) => void;
  onDelete?: (entryId: string) => void;
  onClose: () => void;
}) {
  const isEditing = !!editingEntry;
  const editingVolume = editingEntry?.kind === "volume" ? editingEntry : undefined;
  const editingGap = editingEntry?.kind === "gap" ? editingEntry : undefined;

  // The New Volume / New Gap switch only matters when adding -- editing
  // keeps whatever kind the entry already is.
  const [entryKind, setEntryKind] = useState<"volume" | "gap">(editingEntry?.kind ?? "volume");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [coverUrl, setCoverUrl] = useState<string | undefined>(editingVolume?.coverUrl);
  const [title, setTitle] = useState(editingVolume?.title ?? "");
  // Editing keeps the volume's existing era. Adding via a timeline cell's
  // hover shortcut (defaultStart set) defaults to whichever era that
  // quarter actually falls into, instead of always Golden Age -- e.g.
  // clicking a Bronze Age cell now opens the form pre-set to Bronze Age.
  const [era, setEra] = useState<Era>(
    editingVolume?.era ?? (defaultStart ? eraForQuarterPoint(defaultStart) : ERA_ORDER[0])
  );
  const [number, setNumber] = useState(editingVolume ? String(editingVolume.number) : "");
  const [issuesCollected, setIssuesCollected] = useState(editingVolume?.issuesCollected ?? "");
  const [startYear, setStartYear] = useState(
    editingEntry
      ? String(editingEntry.start.year)
      : defaultStart
      ? String(defaultStart.year)
      : ""
  );
  const [startQuarter, setStartQuarter] = useState<Quarter>(
    editingEntry?.start.quarter ?? defaultStart?.quarter ?? 1
  );
  // The quarter right after defaultStart -- e.g. clicking a Q3 cell
  // pre-fills start at Q3 and end at Q4, not end left blank or equal to
  // start, since a volume is almost never exactly one quarter long.
  const defaultEnd = defaultStart
    ? quarterPointFromIndex(quarterIndex(defaultStart) + 1)
    : undefined;
  const [endYear, setEndYear] = useState(
    editingEntry ? String(editingEntry.end.year) : defaultEnd ? String(defaultEnd.year) : ""
  );
  const [endQuarter, setEndQuarter] = useState<Quarter>(
    editingEntry?.end.quarter ?? defaultEnd?.quarter ?? 1
  );
  const [ownershipStatus, setOwnershipStatus] = useState<OwnershipStatus>(
    editingVolume?.ownershipStatus ?? "announced"
  );
  const [creators, setCreators] = useState(editingVolume?.creators ?? "");
  const [description, setDescription] = useState(editingVolume?.description ?? "");
  // undefined ("Auto") lets assignLanes place this volume automatically --
  // the default for every volume, including a freshly-opened form. Only an
  // explicit 1-N choice here is a deliberate pin (see assignLanes in
  // lib/timeline.ts); "Auto" isn't just "position 1 nobody picked".
  const [swimLanePosition, setSwimLanePosition] = useState<number | undefined>(
    editingVolume?.swimLanePosition
  );
  const [error, setError] = useState<string | null>(null);
  const { visible, closeThen } = useSlidePanel();

  // Focuses the title field when opening in edit mode, so Cmd+V works
  // immediately instead of needing a click into the drawer first.
  //
  // It has to be a genuinely editable element: the browser only generates a
  // `paste` event at all when focus is in an editable context (input,
  // textarea, contenteditable). Focusing the form wrapper instead, even
  // with tabIndex={-1} to make it focusable, produces no paste event for
  // any listener to catch -- don't "simplify" this to that.
  //
  // Add mode is already covered by the title field's own autoFocus below.
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditing) titleRef.current?.focus();
  }, [isEditing]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUrl(await compressImageFile(file));
  };

  // Listens on `document` rather than via onPaste on the form, because a
  // paste event is delivered to whatever currently has focus -- and that
  // isn't reliably inside this form. Notably, right after the drawer opens
  // focus can still be on <body> (the element that was focused before,
  // e.g. the detail panel's Edit button, is gone by then), and a paste
  // targeting <body> never bubbles through the form, so a form-scoped
  // handler simply never runs. Listening at the document catches it
  // wherever it lands.
  //
  // Only active for volumes/speculations -- a gap has no cover to paste
  // into. Pasting text (e.g. into the title field) passes straight through
  // untouched, since getPastedImageFile returns null for it.
  useEffect(() => {
    if (entryKind !== "volume") return;
    const onPaste = async (e: globalThis.ClipboardEvent) => {
      const file = getPastedImageFile(e);
      if (!file) return;
      e.preventDefault();
      setCoverUrl(await compressImageFile(file));
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [entryKind]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const startYearNum = Number(startYear);
    const endYearNum = Number(endYear);

    if (!Number.isInteger(startYearNum) || !Number.isInteger(endYearNum)) {
      setError("Enter valid start and end years.");
      return;
    }

    const start: QuarterPoint = { year: startYearNum, quarter: startQuarter };
    const end: QuarterPoint = { year: endYearNum, quarter: endQuarter };
    const startIdx = quarterIndex(start);
    const endIdx = quarterIndex(end);

    if (endIdx < startIdx) {
      setError(
        `End date (${formatQuarterPoint(end)}) can't be before the start date (${formatQuarterPoint(start)}).`
      );
      return;
    }

    if (entryKind === "gap") {
      closeThen(() =>
        onSave({
          kind: "gap",
          id: editingEntry?.id ?? `${lineId}-gap-${Date.now().toString(36)}`,
          lineId,
          // Publishing gap vs. continuity-placeholder gap is a follow-up --
          // every gap added/edited here defaults to "publication" for now.
          gapType: editingGap?.gapType ?? "publication",
          start,
          end,
        })
      );
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedNumber = number.trim();

    if (!trimmedTitle) {
      setError("Volume title is required.");
      return;
    }

    if (supportsEra) {
      if (!trimmedNumber) {
        setError("Enter a number (e.g. 1) or a placeholder letter (e.g. a) for this era.");
        return;
      }
    } else if (!Number.isInteger(Number(trimmedNumber)) || Number(trimmedNumber) < 1) {
      setError("Enter a valid volume number.");
      return;
    }

    closeThen(() =>
      onSave({
        kind: "volume",
        id: editingEntry?.id ?? `${lineId}-vol-${Date.now().toString(36)}`,
        lineId,
        number: trimmedNumber,
        era: supportsEra ? era : undefined,
        title: trimmedTitle,
        start,
        end,
        issuesCollected: issuesCollected.trim(),
        yearsCovered: yearsCoveredLabel(startYearNum, endYearNum),
        creators: creators.trim(),
        description: description.trim(),
        coverUrl,
        ownershipStatus,
        swimLanePosition: supportsSwimLanePosition && lineSwimLanes > 1 ? swimLanePosition : undefined,
      })
    );
  };

  const entryNoun = entryKind === "gap" ? "Gap" : speculative ? "Speculation" : "Volume";

  return (
    <div
      className={`fixed inset-0 z-[65] flex justify-end bg-black/60 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => closeThen(onClose)}
    >
      <form
        onSubmit={handleSubmit}
        // No overflow/padding here anymore -- split into a scrolling content
        // div and a footer sibling below, so the Cancel/Save buttons stay
        // pinned at the bottom instead of scrolling away with the fields.
        className={`flex h-full w-full max-w-sm flex-col border-l border-neutral-800 bg-[#252526]/50 backdrop-blur-sm transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? `Edit ${entryNoun}` : `Add ${entryNoun}`}
          </h2>
          <button
            type="button"
            onClick={() => closeThen(onClose)}
            className="text-sm text-neutral-400 hover:text-white"
          >
            Close ✕
          </button>
        </div>

        {!isEditing && (
          <div className="mt-4 flex rounded-md border border-neutral-700 p-1">
            <button
              type="button"
              onClick={() => setEntryKind("volume")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                entryKind === "volume"
                  ? "bg-white text-neutral-950"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {speculative ? "New Speculation" : "New Volume"}
            </button>
            <button
              type="button"
              onClick={() => setEntryKind("gap")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                entryKind === "gap"
                  ? "bg-white text-neutral-950"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              New Gap
            </button>
          </div>
        )}

        {entryKind === "volume" && (
          <>
            {coverUrl ? (
              <div className="mt-6">
                <span className="group relative block w-3/5 overflow-hidden rounded-md">
                  <img src={coverUrl} alt="" className="h-auto w-full rounded-md" />
                  <ImageResetOverlay onReset={() => setCoverUrl(undefined)} />
                </span>
                <label className="mt-2 inline-block cursor-pointer text-xs text-neutral-400 hover:text-white">
                  Replace cover image (or paste)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
            ) : (
              <label className="mt-6 block cursor-pointer">
                <span className="flex h-40 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-700 bg-neutral-900 text-sm text-neutral-500 hover:border-neutral-500">
                  <span>Upload cover image</span>
                  <span className="text-xs text-neutral-600">or paste from clipboard</span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}

            <label className="mt-4 block text-sm font-medium text-neutral-300">
              Volume title
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Learning Curve"
                // Adding focuses here outright; editing focuses the same
                // field via titleRef's effect above (caret only, nothing
                // selected) so the drawer is paste-ready on open.
                autoFocus={!isEditing}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
              />
            </label>

            {supportsEra ? (
              <div className="mt-4 flex gap-3">
                <label className="block flex-1 text-sm font-medium text-neutral-300">
                  Era
                  <select
                    value={era}
                    onChange={(e) => setEra(e.target.value as Era)}
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
                  >
                    {ERA_ORDER.map((e) => (
                      <option key={e} value={e}>
                        {ERA_META[e].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block w-24 text-sm font-medium text-neutral-300">
                  Number
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="1 or a"
                    className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                  />
                </label>
              </div>
            ) : (
              <label className="mt-4 block w-28 text-sm font-medium text-neutral-300">
                Volume number
                <input
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="1"
                  className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
                />
              </label>
            )}

            <label className="mt-4 block text-sm font-medium text-neutral-300">
              Issues collected
              <input
                type="text"
                value={issuesCollected}
                onChange={(e) => setIssuesCollected(e.target.value)}
                placeholder="e.g. Ultimate Spider-Man (2000) #1-13"
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
              />
            </label>
          </>
        )}

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-neutral-300">Start</legend>
          <div className="mt-1 flex gap-3">
            <input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="Year"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
            />
            <select
              value={startQuarter}
              onChange={(e) => setStartQuarter(Number(e.target.value) as Quarter)}
              className="w-24 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-neutral-300">End</legend>
          <div className="mt-1 flex gap-3">
            <input
              type="number"
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              placeholder="Year"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
            />
            <select
              value={endQuarter}
              onChange={(e) => setEndQuarter(Number(e.target.value) as Quarter)}
              className="w-24 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-neutral-500 focus:outline-none"
            >
              {QUARTERS.map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {entryKind === "volume" && (
          <>
            {!speculative && (
              <label className="mt-4 block text-sm font-medium text-neutral-300">
                Shelf status
                {/* appearance-none + a manual chevron -- an unstyled <select>
                 * relies on the OS's native control chrome, which some
                 * browsers (Safari in particular) size to the selected
                 * option's text instead of filling the box the way a plain
                 * <input> does. */}
                <div className="relative mt-1">
                  <select
                    value={ownershipStatus}
                    onChange={(e) => setOwnershipStatus(e.target.value as OwnershipStatus)}
                    className="w-full appearance-none rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 pr-8 text-sm text-white focus:border-neutral-500 focus:outline-none"
                  >
                    {OWNERSHIP_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {OWNERSHIP_META[s].label}
                      </option>
                    ))}
                  </select>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </label>
            )}

            {supportsSwimLanePosition && (
              <label className="mt-4 block text-sm font-medium text-neutral-300">
                Swim lane position
                <p className="mt-0.5 text-xs font-normal text-neutral-500">
                  Pin this volume to a specific lane instead of letting it
                  auto-place among the line's other overlapping volumes.
                </p>
                <div className="relative mt-1">
                  <select
                    value={swimLanePosition ?? ""}
                    onChange={(e) =>
                      setSwimLanePosition(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    disabled={lineSwimLanes <= 1}
                    className="w-full appearance-none rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 pr-8 text-sm text-white focus:border-neutral-500 focus:outline-none disabled:opacity-40"
                  >
                    <option value="">Auto</option>
                    {Array.from({ length: lineSwimLanes }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </label>
            )}

            <label className="mt-4 block text-sm font-medium text-neutral-300">
              Creators
              <input
                type="text"
                value={creators}
                onChange={(e) => setCreators(e.target.value)}
                placeholder="e.g. Bendis, Bagley"
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-neutral-300">
              Description
              <p className="mt-0.5 text-xs font-normal text-neutral-500">
                Press Enter for a paragraph break (or paste "&lt;br&gt;") --
                both render as a line break in the detail panel.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
              />
            </label>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        {/* Volumes are deleted from the volume detail panel; gaps have no
         * separate detail view, so deletion lives here instead. */}
        {isEditing && editingGap && onDelete && (
          <div className="mt-4">
            {confirmingDelete ? (
              <div className="rounded-md border border-red-900 bg-red-950/40 p-4">
                <p className="text-sm text-red-200">
                  Are you sure you want to delete this gap? This can't be undone.
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
                    onClick={() => closeThen(() => onDelete(editingGap.id))}
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
                Delete Gap
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pinned footer, outside the scrolling div above -- a solid
       * background (not the panel's translucent one) keeps it readable
       * against whatever field is scrolled underneath it. */}
      <div className="flex gap-3 border-t border-neutral-800 bg-[#252526] p-6">
        <button
          type="button"
          onClick={() => closeThen(onClose)}
          className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
        >
          {isEditing ? `Update ${entryNoun}` : `Add ${entryNoun}`}
        </button>
      </div>
      </form>
    </div>
  );
}
