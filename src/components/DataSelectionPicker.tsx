import { COLLECTIONS } from "../data/collections";
import {
  ALL_PARTS,
  SELECTION_PART_META,
  type Selection,
  type SliceCounts,
} from "../lib/collectionScope";
import { CheckRow } from "./CheckRow";

/**
 * The two-axis picker behind ImportDataPanel's review step -- which
 * collections, and which of the six things a collection can independently
 * carry (see SelectionPart in lib/collectionScope.ts).
 *
 * Used to be three axes and thirteen checkboxes (collections x timeline
 * layer x data type), with four of the ten layer/type combinations always
 * empty -- ownership, reading progress and star ratings don't exist on the
 * speculative layer, and notes don't exist anywhere else. The picker had to
 * grey those four out and subtitle them "Main only"/"Speculative only" to
 * explain why. Flattening layer and type into one six-item list removes
 * the dead combinations outright instead of showing and explaining them.
 *
 * Export dropped this picker entirely (see ExportDataPanel) once its only
 * real use -- narrowing a hand-off to Claude for a seed merge -- moved to
 * its own fixed-slice dialog (CopyCorrectionsButton). Import keeps it
 * because that's the one place the choice has something real to go on:
 * actual per-slice record counts read from the file (see `availability`
 * below), not a guess made before the file even exists.
 *
 * Fully controlled: it renders `value` and reports every toggle through
 * `onChange`, leaving the owner to decide what a valid selection is.
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
   * import file's picker only offers what's really in the file. */
  availability?: SliceCounts;
  collectionSubtitles?: Record<string, string | undefined>;
}) {
  function toggle<T extends string>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
  }

  return (
    <div className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
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
          What to include
        </p>
        <div className="flex flex-col">
          {ALL_PARTS.map((part) => {
            const count = availability?.byPart[part] ?? 0;
            const meta = SELECTION_PART_META[part];
            return (
              <CheckRow
                key={part}
                label={meta.label}
                subtitle={meta.subtitle}
                count={availability ? count : undefined}
                checked={value.parts.includes(part)}
                disabled={availability !== undefined && count === 0}
                onToggle={() => onChange({ ...value, parts: toggle(value.parts, part) })}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
