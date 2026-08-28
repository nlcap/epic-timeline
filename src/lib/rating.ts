import type { RatingRange } from "../types";
import starFilled from "../assets/Star-filled.svg";
import starHalf from "../assets/Star-half.svg";
import starOutline from "../assets/Star-outline.svg";

/** 1-5, the star position indexes both StarRating and the read-only
 * summary on VolumeTile's hover-preview card iterate over. */
export const STAR_INDEXES = [1, 2, 3, 4, 5];

export const RATING_MIN = 0;
export const RATING_MAX = 5;
export const RATING_STEP = 0.5;
/** The filter panel's rating range at rest -- restricts nothing, same
 * "inactive facet" convention an empty Set gives the other facets. Shared
 * so App.tsx's default state, the "Clear" buttons, and the "is this facet
 * active" checks can't drift out of sync with each other. */
export const FULL_RATING_RANGE: RatingRange = [RATING_MIN, RATING_MAX];

/** Whether a rating range actually restricts anything -- i.e. either end
 * has been moved off the full span. Written out inline in six places
 * across App, the filter panel and lib/filters before this, which is
 * exactly the drift FULL_RATING_RANGE above exists to prevent: the
 * constant was shared, but the question asked about it wasn't. */
export function isRatingFilterActive(range: RatingRange): boolean {
  return range[0] > RATING_MIN || range[1] < RATING_MAX;
}

/** Which of the three star assets a single star position shows for a given
 * rating value -- e.g. value 3.5, star 4 -> half (3.5 is exactly "4 minus
 * a half"); star 3 -> filled; star 5 -> outline. Shared by the interactive
 * StarRating widget (src/components/StarRating.tsx) and the read-only
 * summary VolumeTile shows on its hover-preview card, so the two can never
 * disagree on what a given value looks like. */
export function starIconFor(value: number, star: number): string {
  if (value >= star) return starFilled;
  if (value === star - 0.5) return starHalf;
  return starOutline;
}
