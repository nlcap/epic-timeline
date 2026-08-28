import { useCallback, useState } from "react";
import type { FilterMode, OwnershipStatus, RatingRange, ReadingStatus } from "../types";
import { FULL_RATING_RANGE, isRatingFilterActive } from "../lib/rating";

/**
 * Everything narrowing what's on the timeline: the nav search box and the
 * filter panel's four facets, plus how those facets combine.
 *
 * Grouped out of App.tsx mainly for the reset invariant. Two separate
 * paths have to clear the same set of facets -- switching collection tabs
 * (a query scoped to the old tab's lines means nothing on the new one) and
 * the nav's own "clear filters" button -- and they were two hand-written
 * lists of setters that had to be kept in step. Adding the star-rating
 * facet meant remembering both; the next facet would too. Now there's one
 * `clearFacets` and the lists can't drift apart.
 *
 * Every facet's "doesn't restrict anything" resting value is its own empty
 * state -- an empty Set, an empty string, the full 0-5 rating span -- so
 * `filtersActive` is the one place that has to know what "empty" means for
 * each of them.
 */
export function useFilterState() {
  const [searchQuery, setSearchQuery] = useState("");
  const [shelvingFilter, setShelvingFilter] = useState<Set<OwnershipStatus>>(new Set());
  const [readingFilter, setReadingFilter] = useState<Set<ReadingStatus>>(new Set());
  const [ratingFilter, setRatingFilter] = useState<RatingRange>(FULL_RATING_RANGE);
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  // How multiple checked values within a facet combine -- "any" (OR) is the
  // default; "all" (AND) is only offered because Tags is multi-valued per
  // line. Deliberately NOT touched by either clear below: it's a "how do I
  // want to search" preference, not itself a filter selection.
  const [filterMode, setFilterMode] = useState<FilterMode>("any");

  /** The four facets back to their resting values, leaving the search box
   * and filterMode alone -- what the nav's "clear filters" button does. */
  const clearFacets = useCallback(() => {
    setShelvingFilter(new Set());
    setReadingFilter(new Set());
    setRatingFilter(FULL_RATING_RANGE);
    setTagFilter(new Set());
  }, []);

  /** The facets *and* the search box -- what a collection switch does,
   * since a query typed against one tab's lines has nothing to say about
   * another's. */
  const clearAll = useCallback(() => {
    setSearchQuery("");
    clearFacets();
  }, [clearFacets]);

  /** Whether anything in the filter panel is currently narrowing the view.
   * The search box is deliberately excluded -- it has its own visible
   * text as its indicator, while the panel's state is only visible once
   * it's open, which is what the nav's filter badge is for. */
  const filtersActive =
    shelvingFilter.size > 0 ||
    readingFilter.size > 0 ||
    isRatingFilterActive(ratingFilter) ||
    tagFilter.size > 0;

  return {
    searchQuery,
    setSearchQuery,
    shelvingFilter,
    setShelvingFilter,
    readingFilter,
    setReadingFilter,
    ratingFilter,
    setRatingFilter,
    tagFilter,
    setTagFilter,
    filterMode,
    setFilterMode,
    filtersActive,
    clearFacets,
    clearAll,
  };
}
