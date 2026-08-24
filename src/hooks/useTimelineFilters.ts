import { useMemo } from "react";
import type {
  FilterMode,
  Line,
  OwnershipStatus,
  RatingRange,
  ReadingStatus,
  TimelineEntry,
} from "../types";
import { filterLines, matchingLineIds, searchMatches } from "../lib/filters";

const EMPTY_IDS: ReadonlySet<string> = new Set();

/**
 * Memoized wrapper around lib/filters -- the React half of "which lines are
 * on screen right now". Kept separate from the matching rules themselves so
 * those stay plain functions over plain data (and testable as such); this
 * only decides when they need re-running.
 *
 * Three memos rather than one: the facet match is the expensive half (it
 * walks every entry and every line), and it must not be redone on each
 * keystroke in the search box, which only ever narrows the result of it.
 * The search match does walk every entry per keystroke -- it has to, now
 * that it reads volume text and not just line names -- but it's a plain
 * substring scan that short-circuits on the first field to hit.
 */
export function useTimelineFilters({
  lines,
  entries,
  searchEntries,
  searchQuery,
  shelvingFilter,
  readingFilter,
  ratingFilter,
  tagFilter,
  filterMode,
  speculationMode,
  speculativeLineIds,
}: {
  /** Every line on the timeline, official and speculative. */
  lines: Line[];
  /** Official resolved entries only -- speculative ones carry no status. */
  entries: TimelineEntry[];
  /** What the search box reads: official entries plus, with Speculation Mode
   * on, speculative ones -- unlike the status facets, a speculative volume's
   * text is just as searchable as an official one's. */
  searchEntries: TimelineEntry[];
  searchQuery: string;
  shelvingFilter: ReadonlySet<OwnershipStatus>;
  readingFilter: ReadonlySet<ReadingStatus>;
  ratingFilter: RatingRange;
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
        ratingFilter,
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
      ratingFilter,
      tagFilter,
      filterMode,
      speculationMode,
      speculativeLineIds,
    ]
  );

  const search = useMemo(
    () => searchMatches({ query: searchQuery, lines, entries: searchEntries }),
    [searchQuery, lines, searchEntries]
  );

  const filteredLines = useMemo(
    () => filterLines(lines, search, matchedLineIds),
    [lines, search, matchedLineIds]
  );

  // `search` comes back out because it also decides which volume tiles
  // render within a surviving line (see volumeVisibleUnderSearch and App's
  // entriesByLine) -- the same reason volumeMatchesStatusFilters is shared.
  return { lines: filteredLines, search };
}
