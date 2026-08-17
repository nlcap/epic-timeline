import { COLLECTIONS } from "../data/collections";
import {
  ALL_KINDS,
  ALL_SCOPES,
  type DataKind,
  type Selection,
  type SliceCounts,
  type TimelineScope,
} from "../lib/collectionScope";
import { CheckRow } from "./CheckRow";

const SCOPE_LABELS: Record<TimelineScope, string> = {
  main: "Main Timeline",
  speculative: "Speculative Timeline",
};

const KIND_LABELS: Record<DataKind, string> = {
  edits: "Lines & volumes",
  notes: "Notes",
  ownership: "Ownership",
  reading: "Reading progress",
};

/** Called out on the rows that only exist on one layer, so an empty result
 * reads as "that combination doesn't exist" rather than "something's
 * broken". Notes are a Speculation Mode entry with no main-timeline
 * counterpart; ownership and reading progress are never carried by
 * speculative entries. */
const KIND_SUBTITLES: Partial<Record<DataKind, string>> = {
  notes: "Speculative only",
  ownership: "Main only",
  reading: "Main only",
};

/**
 * The three-axis picker shared by the export and import dialogs --
 * which collections, which timeline layer, and which kinds of main-timeline
 * data. Mirrors (and extends by one axis) the checklist the reset dialog
 * has always had, so all three ways of moving data around are chosen the
 * same way. See Selection in lib/collectionScope.ts for what the axes mean
 * and how they combine into a set of stores.
 *
 * Fully controlled: it renders `value` and reports every toggle through
 * `onChange`, leaving the owner to decide what a valid selection is (the
 * export dialog starts with everything checked; the import dialog starts
 * with whatever the file actually holds).
 */
export function DataSelectionPicker({
  value,
  onChange,
  availability,
  collectionSubtitles,
}: {
  value: Selection;
  onChange: (next: Selection) => void;
  /** Record counts from the source being sliced. When given, rows the
   * source has nothing for show "none" and can't be checked -- so an
   * import file's picker only offers what's really in the file. Omit for
   * an unfiltered picker (export). */
  availability?: SliceCounts;
  collectionSubtitles?: Record<string, string | undefined>;
}) {
  function toggle<T extends string>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
  }

  return (
    // Three columns rather than three stacked lists: eleven checkboxes in a
    // single column pushes the JSON preview (export) or the replace/merge
    // choice (import) below the fold of an 85vh dialog, which hides the
    // thing the picker is meant to be feeding into.
    <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Collections
        </p>
        <div className="flex flex-col">
          {COLLECTIONS.map((c) => {
            const count = availability?.byCollection[c.id] ?? 0;
            return (
              <CheckRow
                key={c.id}
                label={c.name}
                subtitle={collectionSubtitles?.[c.id]}
                count={availability ? count : undefined}
                checked={value.collectionIds.includes(c.id)}
                disabled={availability !== undefined && count === 0}
                onToggle={() =>
                  onChange({ ...value, collectionIds: toggle(value.collectionIds, c.id) })
                }
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Timeline
        </p>
        <div className="flex flex-col">
          {ALL_SCOPES.map((scope) => {
            const count = availability?.byScope[scope] ?? 0;
            return (
              <CheckRow
                key={scope}
                label={SCOPE_LABELS[scope]}
                count={availability ? count : undefined}
                checked={value.scopes.includes(scope)}
                disabled={availability !== undefined && count === 0}
                onToggle={() => onChange({ ...value, scopes: toggle(value.scopes, scope) })}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Data types
        </p>
        <div className="flex flex-col">
          {ALL_KINDS.map((kind) => {
            const count = availability?.byKind[kind] ?? 0;
            return (
              <CheckRow
                key={kind}
                label={KIND_LABELS[kind]}
                subtitle={KIND_SUBTITLES[kind]}
                count={availability ? count : undefined}
                checked={value.kinds.includes(kind)}
                disabled={availability !== undefined && count === 0}
                onToggle={() => onChange({ ...value, kinds: toggle(value.kinds, kind) })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
