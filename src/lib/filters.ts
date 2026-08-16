import type {
  FilterMode,
  Line,
  OwnershipStatus,
  ReadingStatus,
  TimelineEntry,
  Volume,
} from "../types";

/**
 * Pure matching rules behind the nav search box and the filter panel (see
 * FilterPanel.tsx). Split out of App.tsx so the logic that decides what's on
 * screen can be tested directly on plain data, without standing up the whole
 * component -- see filters.test.ts and useTimelineFilters, which is just the
 * memoized React wrapper around these.
 */

/**
 * Whether a volume matches every currently-active filter-panel facet -- an
 * empty facet doesn't restrict anything, so a volume only needs to satisfy
 * the facets that actually have a selection.
 *
 * Shared by matchingLineIds (which decides whether a line has a matching
 * volume at all) and App's entriesByLine (which decides which of that line's
 * volume tiles actually render) so the two can't disagree about what counts
 * as a match -- e.g. one volume Ordered-but-not-Finished and a different
 * volume Finished-but-not-Ordered must NOT combine to make a line pass an
 * "Ordered AND Finished" filter, since no single volume of it actually
 * satisfies both.
 */
export function volumeMatchesStatusFilters(
  volume: Volume,
  shelvingFilter: ReadonlySet<OwnershipStatus>,
  readingFilter: ReadonlySet<ReadingStatus>
): boolean {
  if (shelvingFilter.size > 0 && !shelvingFilter.has(volume.ownershipStatus)) return false;
  if (
    readingFilter.size > 0 &&
    !(volume.readingStatus !== undefined && readingFilter.has(volume.readingStatus))
  ) {
    return false;
  }
  return true;
}

/**
 * Whether a line matches the tag facet. "any" mode: carries at least one
 * checked tag. "all" mode: every checked tag must be on the line.
 */
export function lineMatchesTagFilter(
  line: Line,
  tagFilter: ReadonlySet<string>,
  mode: FilterMode
): boolean {
  if (mode === "all") return [...tagFilter].every((tag) => line.tags?.includes(tag));
  return !!line.tags?.some((tag) => tagFilter.has(tag));
}

/**
 * Which line ids survive the filter panel's facets, or null when no facet is
 * active at all (i.e. don't restrict anything).
 *
 * Shelving/reading match at the volume level -- a line passes that pair if it
 * has at least one volume matching every active one of them at once. Tags
 * live on the line itself, so that facet is evaluated separately and
 * intersected in: a line must pass every *active* facet, not just one of
 * them, whatever the Any/All mode says about how values combine *within* a
 * facet.
 *
 * `speculativeLineIds` pass the shelving/reading facet unconditionally.
 * Speculative content carries neither status (App only scans official
 * entries here), so without that exemption a speculative line -- which by
 * definition has no official volumes -- could never match, and the whole
 * Speculation Mode layer vanished the moment any status facet was checked.
 * The tag facet still applies to them normally.
 */
export function matchingLineIds({
  entries,
  lines,
  shelvingFilter,
  readingFilter,
  tagFilter,
  filterMode,
  speculativeLineIds,
}: {
  /** Official (non-speculative) resolved entries -- the only ones carrying a
   * shelving or reading status to match on. */
  entries: readonly TimelineEntry[];
  /** Every line currently on the timeline, official and speculative. */
  lines: readonly Line[];
  shelvingFilter: ReadonlySet<OwnershipStatus>;
  readingFilter: ReadonlySet<ReadingStatus>;
  tagFilter: ReadonlySet<string>;
  filterMode: FilterMode;
  /** Empty when Speculation Mode is off -- nothing to exempt. */
  speculativeLineIds: ReadonlySet<string>;
}): Set<string> | null {
  const shelvingOrReadingActive = shelvingFilter.size > 0 || readingFilter.size > 0;
  const tagsActive = tagFilter.size > 0;
  if (!shelvingOrReadingActive && !tagsActive) return null;

  const matchSets: Set<string>[] = [];
  if (shelvingOrReadingActive) {
    const volumeMatches = new Set<string>();
    for (const entry of entries) {
      if (
        entry.kind === "volume" &&
        volumeMatchesStatusFilters(entry, shelvingFilter, readingFilter)
      ) {
        volumeMatches.add(entry.lineId);
      }
    }
    for (const id of speculativeLineIds) volumeMatches.add(id);
    matchSets.push(volumeMatches);
  }
  if (tagsActive) {
    const tagMatches = new Set<string>();
    for (const line of lines) {
      if (lineMatchesTagFilter(line, tagFilter, filterMode)) tagMatches.add(line.id);
    }
    matchSets.push(tagMatches);
  }

  return matchSets.reduce((acc, set) => new Set([...acc].filter((id) => set.has(id))));
}

/**
 * Narrows lines by the nav search box (case-insensitive substring of the
 * line title) and then by the filter panel's already-resolved line ids.
 * Either, both, or neither can be active at once.
 */
export function filterLines(
  lines: Line[],
  searchQuery: string,
  matchedLineIds: ReadonlySet<string> | null
): Line[] {
  const query = searchQuery.trim().toLowerCase();
  // Deliberately not a defensive copy -- with neither filter active this
  // hands back the very same array, so the caller's memo keeps a stable
  // reference for the (common) unfiltered case.
  let result = lines;
  if (query.length >= 1) {
    result = result.filter((line) => line.name.toLowerCase().includes(query));
  }
  if (matchedLineIds) {
    result = result.filter((line) => matchedLineIds.has(line.id));
  }
  return result;
}
