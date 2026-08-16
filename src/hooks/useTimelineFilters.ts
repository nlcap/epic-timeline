import { useMemo } from "react";
import type {
  FilterMode,
  Line,
  OwnershipStatus,
  ReadingStatus,
  TimelineEntry,
} from "../types";
import { filterLines, matchingLineIds } from "../lib/filters";

const EMPTY_IDS: ReadonlySet<string> = new Set();

/**
 * Memoized wrapper around lib/filters -- the React half of "which lines are
 * on screen right now". Kept separate from the matching rules themselves so
 * those stay plain functions over plain data (and testable as such); this
 * only decides when they need re-running.
 *
 * Two memos rather than one: the facet match is the expensive half (it walks
 * every entry and every line), and it must not be redone on each keystroke
 * in the search box, which only ever narrows the result of it.
 */
export function useTimelineFilters({
  lines,
  entries,
  searchQuery,
  shelvingFilter,
  readingFilter,
  tagFilter,
  filterMode,
  speculationMode,
  speculativeLineIds,
}: {
  /** Every line on the timeline, official and speculative. */
  lines: Line[];
  /** Official resolved entries only -- speculative ones carry no status. */
  entries: TimelineEntry[];
  searchQuery: string;
  shelvingFilter: ReadonlySet<OwnershipStatus>;
  readingFilter: ReadonlySet<ReadingStatus>;
  tagFilter: ReadonlySet<string>;
  filterMode: FilterMode;
  speculationMode: boolean;
  speculativeLineIds: ReadonlySet<string>;
}) {
  const matchedLineIds = useMemo(
    () =>
      matchingLineIds({
        entries,
        lines,
        shelvingFilter,
        readingFilter,
        tagFilter,
        filterMode,
        // Nothing to exempt with the mode off: speculative lines aren't
        // among `lines` in the first place.
        speculativeLineIds: speculationMode ? speculativeLineIds : EMPTY_IDS,
      }),
    [
      entries,
      lines,
      shelvingFilter,
      readingFilter,
      tagFilter,
      filterMode,
      speculationMode,
      speculativeLineIds,
    ]
  );

  return useMemo(
    () => filterLines(lines, searchQuery, matchedLineIds),
    [lines, searchQuery, matchedLineIds]
  );
}
