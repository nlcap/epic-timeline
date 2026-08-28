import type {
  FilterMode,
  Line,
  OwnershipStatus,
  RatingRange,
  ReadingStatus,
  TimelineEntry,
  Volume,
} from "../types";
import { FULL_RATING_RANGE, isRatingFilterActive } from "./rating";

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
  readingFilter: ReadonlySet<ReadingStatus>,
  // Defaulted (not required) so every pre-existing call site -- including
  // filters.test.ts's -- keeps compiling without being touched just to
  // pass along an "inactive" value they don't otherwise care about.
  ratingFilter: RatingRange = FULL_RATING_RANGE
): boolean {
  if (shelvingFilter.size > 0 && !shelvingFilter.has(volume.ownershipStatus)) return false;
  if (
    readingFilter.size > 0 &&
    !(volume.readingStatus !== undefined && readingFilter.has(volume.readingStatus))
  ) {
    return false;
  }
  // Same "undefined fails an active facet" rule as readingStatus above --
  // an unrated volume can't be said to be "3+ stars", so it's excluded the
  // moment the range narrows at all. At the default full range this
  // branch is skipped entirely, so an unrated volume still passes when
  // nothing's actually filtering on rating.
  if (isRatingFilterActive(ratingFilter)) {
    if (
      volume.rating === undefined ||
      volume.rating < ratingFilter[0] ||
      volume.rating > ratingFilter[1]
    ) {
      return false;
    }
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
 * `speculativeLineIds` pass the shelving/reading/rating facet
 * unconditionally. Speculative content carries none of the three (App only
 * scans official entries here), so without that exemption a speculative
 * line -- which by definition has no official volumes -- could never
 * match, and the whole Speculation Mode layer vanished the moment any
 * volume facet was checked. The tag facet still applies to them normally.
 */
export function matchingLineIds({
  entries,
  lines,
  shelvingFilter,
  readingFilter,
  ratingFilter = FULL_RATING_RANGE,
  tagFilter,
  filterMode,
  speculativeLineIds,
}: {
  /** Official (non-speculative) resolved entries -- the only ones carrying a
   * shelving, reading, or rating status to match on. */
  entries: readonly TimelineEntry[];
  /** Every line currently on the timeline, official and speculative. */
  lines: readonly Line[];
  shelvingFilter: ReadonlySet<OwnershipStatus>;
  readingFilter: ReadonlySet<ReadingStatus>;
  /** Defaults to the full (inactive) range -- optional so call sites that
   * predate this facet don't need updating just to opt out of it. */
  ratingFilter?: RatingRange;
  tagFilter: ReadonlySet<string>;
  filterMode: FilterMode;
  /** Empty when Speculation Mode is off -- nothing to exempt. */
  speculativeLineIds: ReadonlySet<string>;
}): Set<string> | null {
  const volumeFacetsActive =
    shelvingFilter.size > 0 ||
    readingFilter.size > 0 ||
    isRatingFilterActive(ratingFilter);
  const tagsActive = tagFilter.size > 0;
  if (!volumeFacetsActive && !tagsActive) return null;

  const matchSets: Set<string>[] = [];
  if (volumeFacetsActive) {
    const volumeMatches = new Set<string>();
    for (const entry of entries) {
      if (
        entry.kind === "volume" &&
        volumeMatchesStatusFilters(entry, shelvingFilter, readingFilter, ratingFilter)
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
 * The volume fields the nav search reads, in rough order of how likely a
 * query is to hit them -- `some` short-circuits, and description is both the
 * longest and the least likely to be what someone typed at.
 */
function volumeSearchFields(volume: Volume): (string | undefined)[] {
  return [
    volume.title,
    volume.writers,
    volume.pencillers,
    volume.inkers,
    volume.issuesCollected,
    volume.description,
  ];
}

/** `query` must already be trimmed and lower-cased -- see searchMatches. */
export function volumeMatchesSearch(volume: Volume, query: string): boolean {
  return volumeSearchFields(volume).some((field) => field?.toLowerCase().includes(query));
}

/**
 * What a nav search query matches, or null when the box is empty (which
 * restricts nothing).
 *
 * A line survives on either its own name or any of its volumes, but the two
 * mean different things on screen, so they're tracked apart:
 *
 * - Name match ("batman") is about the whole line, so every volume of it
 *   stays -- narrowing to volumes that happen to repeat the line's name in
 *   their own text would hide most of the run for no good reason.
 * - Volume match ("kirby") is about those volumes specifically, so the line
 *   comes back trimmed to just them -- the same "clear out what didn't
 *   match" behavior the shelving/reading facets already have at tile level.
 *
 * A line can be in both sets; name match wins, since it's the broader claim.
 */
export interface SearchMatch {
  /** Lines whose own name matched -- these keep every volume. */
  nameMatchedLineIds: Set<string>;
  /** Volumes that matched on their own text. */
  volumeIds: Set<string>;
  /** Every line the query turned up, by either route. */
  lineIds: Set<string>;
}

export function searchMatches({
  query,
  lines,
  entries,
}: {
  query: string;
  lines: readonly Line[];
  /** Everything on the timeline the search should see -- official plus, when
   * Speculation Mode is on, speculative entries. */
  entries: readonly TimelineEntry[];
}): SearchMatch | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const nameMatchedLineIds = new Set<string>();
  for (const line of lines) {
    if (line.name.toLowerCase().includes(q)) nameMatchedLineIds.add(line.id);
  }

  const volumeIds = new Set<string>();
  const lineIds = new Set(nameMatchedLineIds);
  for (const entry of entries) {
    if (entry.kind !== "volume") continue;
    if (!volumeMatchesSearch(entry, q)) continue;
    volumeIds.add(entry.id);
    lineIds.add(entry.lineId);
  }

  return { nameMatchedLineIds, volumeIds, lineIds };
}

/**
 * Whether a volume tile still renders under an active search. Lines that
 * matched by name keep everything; lines that only matched through their
 * volumes keep just those. Gaps and notes aren't volumes and never reach
 * this -- they ride along with whatever line survived, same as they do
 * under the status facets.
 */
export function volumeVisibleUnderSearch(
  volume: Volume,
  search: SearchMatch | null
): boolean {
  if (!search) return true;
  if (search.nameMatchedLineIds.has(volume.lineId)) return true;
  return search.volumeIds.has(volume.id);
}

/**
 * Narrows lines by the nav search box and then by the filter panel's
 * already-resolved line ids. Either, both, or neither can be active at once.
 */
export function filterLines(
  lines: Line[],
  search: SearchMatch | null,
  matchedLineIds: ReadonlySet<string> | null
): Line[] {
  // Deliberately not a defensive copy -- with neither filter active this
  // hands back the very same array, so the caller's memo keeps a stable
  // reference for the (common) unfiltered case.
  let result = lines;
  if (search) {
    result = result.filter((line) => search.lineIds.has(line.id));
  }
  if (matchedLineIds) {
    result = result.filter((line) => matchedLineIds.has(line.id));
  }
  return result;
}
