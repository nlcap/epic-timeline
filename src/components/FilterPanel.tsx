import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { FilterMode, OwnershipStatus, ReadingStatus } from "../types";
import { OWNERSHIP_META, OWNERSHIP_ORDER } from "../lib/ownership";
import { READING_STATUS_META, READING_STATUS_ORDER } from "../lib/readingStatus";
import { useSlidePanel } from "../hooks/useSlidePanel";
import { useEscapeToClose } from "../hooks/useEscapeToClose";
// Same {value, label, icon} shape the volume detail panel's status pickers
// use -- deliberately shared, so a status's icon can't end up drawn one way
// in the picker and another way in the filter for it.
import type { StatusDropdownOption } from "./StatusDropdown";

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

/**
 * Adds or removes one value from a facet's draft set.
 *
 * "any" mode is a plain checkbox toggle. "all" mode is radio-style
 * replace-on-select: ANDing multiple values of a single-valued field could
 * never match anything, so picking a second one swaps rather than adds, and
 * picking the checked one again clears the facet.
 */
function toggleInSet<T>(prev: ReadonlySet<T>, value: T, mode: FilterMode): Set<T> {
  if (mode === "all") return prev.has(value) ? new Set() : new Set([value]);
  const next = new Set(prev);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** One whole single-valued facet -- heading, per-facet Clear, and a row per
 * option. Shelving and Reading are the same section twice over, differing
 * only in their _ORDER/_META pair and how their icon is drawn, so they share
 * this rather than keeping two copies that have to be edited in lockstep. */
function FilterStatusSection<T extends string>({
  label,
  options,
  draft,
  mode,
  onChange,
}: {
  label: string;
  options: StatusDropdownOption<T>[];
  draft: ReadonlySet<T>;
  mode: FilterMode;
  onChange: Dispatch<SetStateAction<Set<T>>>;
}) {
  return (
    <div className="mt-6">
      <FilterSectionHeading
        label={label}
        disabled={draft.size === 0}
        onClear={() => onChange(new Set())}
      />
      <div className="mt-2 flex flex-col gap-0.5">
        {options.map((option) => (
          <FilterSelectableRow
            key={option.value}
            variant={mode === "all" ? "radio" : "checkbox"}
            selected={draft.has(option.value)}
            onToggle={() => onChange((prev) => toggleInSet(prev, option.value, mode))}
            icon={option.icon}
            label={option.label}
          />
        ))}
      </div>
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

  // Always "any" semantics, even in All mode -- tags are multi-valued per
  // line, so "has every one of these" is a real query and the chips stay
  // multi-select (see the docblock above).
  const toggleTag = (tag: string) => {
    setDraftTags((prev) => toggleInSet(prev, tag, "any"));
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

          <FilterStatusSection
            label="Shelving Status"
            mode={draftMode}
            draft={draftShelving}
            onChange={setDraftShelving}
            options={OWNERSHIP_ORDER.map((status) => ({
              value: status,
              label: OWNERSHIP_META[status].label,
              icon: (
                <img src={OWNERSHIP_META[status].iconUrl} alt="" className="h-3 w-3 shrink-0" />
              ),
            }))}
          />

          <FilterStatusSection
            label="Reading Status"
            mode={draftMode}
            draft={draftReading}
            onChange={setDraftReading}
            options={READING_STATUS_ORDER.map((status) => ({
              value: status,
              label: READING_STATUS_META[status].label,
              icon: (
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${READING_STATUS_META[status].dotClassName}`}
                />
              ),
            }))}
          />

          {timelineTags.length > 0 && (
            <div className="mt-6">
              <FilterSectionHeading
                label="Tags"
                disabled={draftTags.size === 0}
                onClear={() => setDraftTags(new Set())}
              />
              {/* mt-4, not mt-2 like FilterStatusSection's rows -- a
               * checkbox/radio row's visible glyph sits inset from the row
               * by its own py-2 padding, while a chip's border sits flush
               * with its margin. Matching margins would leave less visible
               * whitespace above the chips than above the rows above; this
               * makes up the difference so the gap reads the same. */}
              <div className="mt-4 flex flex-wrap gap-1.5">
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
