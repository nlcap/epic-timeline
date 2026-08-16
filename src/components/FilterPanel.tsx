import { useEffect, useState, type ReactNode } from "react";
import type { FilterMode, OwnershipStatus, ReadingStatus } from "../types";
import { OWNERSHIP_META, OWNERSHIP_ORDER } from "../lib/ownership";
import { READING_STATUS_META, READING_STATUS_ORDER } from "../lib/readingStatus";
import { useSlidePanel } from "../hooks/useSlidePanel";
import { useEscapeToClose } from "../hooks/useEscapeToClose";

/** One checkbox (Any mode) or radio (All mode) row -- custom rather than a
 * native <input> to match the icon+label rows used everywhere else in the
 * app (see StatusDropdown's option rows). Only the indicator's shape and
 * fill differ between variants; selecting/clearing is the caller's job
 * (see toggleShelving/toggleReading below for the radio-style
 * replace-on-select behavior). */
function FilterSelectableRow({
  variant,
  selected,
  onToggle,
  icon,
  label,
}: {
  variant: "checkbox" | "radio";
  selected: boolean;
  onToggle: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-white hover:bg-neutral-800"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
          variant === "radio" ? "rounded-full" : "rounded"
        } ${selected ? "border-white bg-white" : "border-neutral-600"}`}
      >
        {selected &&
          (variant === "radio" ? (
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-950" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 text-neutral-950"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          ))}
      </span>
      {icon}
      {label}
    </button>
  );
}

/** Section heading used above each facet's rows -- adds a right-justified
 * "Clear" that only resets this one facet's draft, distinct from the
 * panel-wide "Clear all filters" above the sections. */
function FilterSectionHeading({
  label,
  onClear,
  disabled,
}: {
  label: string;
  onClear: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</h3>
      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        className={`text-xs font-medium ${
          disabled ? "cursor-not-allowed text-neutral-600" : "text-blue-400 hover:text-blue-300"
        }`}
      >
        Clear
      </button>
    </div>
  );
}

/** Same pill footprint (size/padding/shape) as TagInput's TagPill, so a
 * filter chip and an edit-form tag chip read as the same kind of object --
 * but toggleable rather than remove-only: inactive is an outline (border,
 * no fill, "+" to activate); active is filled neutral-100 with "-" to
 * deactivate. Both states keep an identical (1px, just transparent when
 * filled) border so the chip doesn't change size when toggled. */
function FilterTagChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`flex items-center gap-1 rounded-full border py-0.5 pl-2 pr-1.5 text-xs font-medium ${
        active
          ? "border-transparent bg-neutral-100 text-neutral-900"
          : "border-neutral-400 text-neutral-400 hover:border-neutral-300 hover:text-neutral-300"
      }`}
    >
      {label}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="h-3 w-3"
      >
        {active ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
    </button>
  );
}

/**
 * Right-side slide-out panel for filtering the visible lines -- shelving
 * and reading status (per-volume facets) plus tags (a per-line facet).
 * Facets with nothing checked don't filter anything; a line must pass
 * every active facet (see the AND across facets in App.tsx's
 * statusFilteredLineIds).
 *
 * The Any/All mode toggle controls how a facet's own multiple checked
 * values combine: "any" is OR (a line passes if it matches at least one),
 * "all" is AND (must match all of them at once). AND is only meaningful
 * for a multi-valued field, so in "all" mode Shelving/Reading -- single-
 * valued per volume -- switch from checkboxes to radios instead of
 * offering a combination that could never match anything; Tags stays
 * checkboxes since "has every one of these tags" is a real query. Flipping
 * the mode either direction clears all three draft facets rather than
 * silently keeping a selection whose meaning just changed underneath it.
 *
 * Draft/apply, same as VolumeFormDrawer/LineFormDrawer: checking boxes here
 * only edits local state, seeded from the currently-applied filters on
 * mount -- nothing actually filters the timeline until "Apply Filters"
 * commits the draft up to App.tsx, and "Cancel" (or the backdrop/Close ✕)
 * just discards it.
 */
export function FilterPanel({
  filterMode,
  shelvingFilter,
  readingFilter,
  tagFilter,
  timelineTags,
  onApply,
  onClose,
}: {
  filterMode: FilterMode;
  shelvingFilter: ReadonlySet<OwnershipStatus>;
  readingFilter: ReadonlySet<ReadingStatus>;
  tagFilter: ReadonlySet<string>;
  /** Every tag used anywhere on the current timeline (see App.tsx's
   * timelineTags) -- the full set of chips this panel can offer. */
  timelineTags: string[];
  onApply: (
    mode: FilterMode,
    shelving: Set<OwnershipStatus>,
    reading: Set<ReadingStatus>,
    tags: Set<string>
  ) => void;
  onClose: () => void;
}) {
  const { visible, closeThen } = useSlidePanel();
  const [draftMode, setDraftMode] = useState<FilterMode>(filterMode);
  const [draftShelving, setDraftShelving] = useState<Set<OwnershipStatus>>(
    () => new Set(shelvingFilter)
  );
  const [draftReading, setDraftReading] = useState<Set<ReadingStatus>>(
    () => new Set(readingFilter)
  );
  const [draftTags, setDraftTags] = useState<Set<string>>(() => new Set(tagFilter));

  // Switching mode clears every facet's draft rather than translating an
  // existing selection -- collapsing a multi-checked shelving selection
  // down to "just the first one" would be a silent, surprising pick made
  // on the user's behalf, so this asks them to re-pick under the new mode
  // instead. Applies both directions (All -> Any clears too) so there's
  // one rule, not a direction-dependent exception.
  const setMode = (mode: FilterMode) => {
    if (mode === draftMode) return;
    setDraftMode(mode);
    setDraftShelving(new Set());
    setDraftReading(new Set());
    setDraftTags(new Set());
  };

  const toggleShelving = (status: OwnershipStatus) => {
    setDraftShelving((prev) => {
      if (draftMode === "all") return prev.has(status) ? new Set() : new Set([status]);
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };
  const toggleReading = (status: ReadingStatus) => {
    setDraftReading((prev) => {
      if (draftMode === "all") return prev.has(status) ? new Set() : new Set([status]);
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };
  const toggleTag = (tag: string) => {
    setDraftTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const hasDraftSelections =
    draftShelving.size > 0 || draftReading.size > 0 || draftTags.size > 0;

  useEscapeToClose(closeThen, onClose);

  // Cmd/Ctrl+Enter applies the draft, same as clicking Apply Filters --
  // not gated on a typing-target check like the app's bare-key shortcuts,
  // since the modifier already makes this impossible to trigger by accident
  // while just typing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        closeThen(() => onApply(draftMode, draftShelving, draftReading, draftTags));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeThen, onApply, draftMode, draftShelving, draftReading, draftTags]);

  return (
    <div
      className={`fixed inset-0 z-[65] flex justify-end bg-black/60 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={() => closeThen(onClose)}
    >
      <div
        className={`flex h-full w-full max-w-sm flex-col border-l border-neutral-800 bg-[#252526]/50 backdrop-blur-sm transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Filters</h2>
            <button
              type="button"
              onClick={() => closeThen(onClose)}
              className="text-sm text-neutral-400 hover:text-white"
            >
              Close ✕
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex rounded-md border border-neutral-700 p-1">
              <button
                type="button"
                onClick={() => setMode("any")}
                aria-pressed={draftMode === "any"}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  draftMode === "any"
                    ? "bg-white text-neutral-950"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Any
              </button>
              <button
                type="button"
                onClick={() => setMode("all")}
                aria-pressed={draftMode === "all"}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  draftMode === "all"
                    ? "bg-white text-neutral-950"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                All
              </button>
            </div>
            <button
              type="button"
              disabled={!hasDraftSelections}
              onClick={() => {
                setDraftShelving(new Set());
                setDraftReading(new Set());
                setDraftTags(new Set());
              }}
              className={`text-xs font-medium ${
                hasDraftSelections
                  ? "text-blue-400 hover:text-blue-300"
                  : "cursor-not-allowed text-neutral-600"
              }`}
            >
              Clear all filters
            </button>
          </div>

          <div className="mt-6">
            <FilterSectionHeading
              label="Shelving Status"
              disabled={draftShelving.size === 0}
              onClear={() => setDraftShelving(new Set())}
            />
            <div className="mt-2 flex flex-col gap-0.5">
              {OWNERSHIP_ORDER.map((status) => {
                const meta = OWNERSHIP_META[status];
                return (
                  <FilterSelectableRow
                    key={status}
                    variant={draftMode === "all" ? "radio" : "checkbox"}
                    selected={draftShelving.has(status)}
                    onToggle={() => toggleShelving(status)}
                    icon={<img src={meta.iconUrl} alt="" className="h-3 w-3 shrink-0" />}
                    label={meta.label}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <FilterSectionHeading
              label="Reading Status"
              disabled={draftReading.size === 0}
              onClear={() => setDraftReading(new Set())}
            />
            <div className="mt-2 flex flex-col gap-0.5">
              {READING_STATUS_ORDER.map((status) => {
                const meta = READING_STATUS_META[status];
                return (
                  <FilterSelectableRow
                    key={status}
                    variant={draftMode === "all" ? "radio" : "checkbox"}
                    selected={draftReading.has(status)}
                    onToggle={() => toggleReading(status)}
                    icon={
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dotClassName}`}
                      />
                    }
                    label={meta.label}
                  />
                );
              })}
            </div>
          </div>

          {timelineTags.length > 0 && (
            <div className="mt-6">
              <FilterSectionHeading
                label="Tags"
                disabled={draftTags.size === 0}
                onClear={() => setDraftTags(new Set())}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {timelineTags.map((tag) => (
                  <FilterTagChip
                    key={tag}
                    label={tag}
                    active={draftTags.has(tag)}
                    onToggle={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pinned footer, same split-from-scrolling-content pattern as
         * VolumeFormDrawer/LineFormDrawer's Cancel/Save bar. */}
        <div className="flex gap-3 border-t border-neutral-800 bg-[#252526] p-6">
          <button
            type="button"
            onClick={() => closeThen(onClose)}
            className="flex-1 rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              closeThen(() => onApply(draftMode, draftShelving, draftReading, draftTags))
            }
            className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
