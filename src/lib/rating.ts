import starFilled from "../assets/Star-filled.svg";
import starHalf from "../assets/Star-half.svg";
import starOutline from "../assets/Star-outline.svg";

/** 1-5, the star position indexes both StarRating and the read-only
 * summary on VolumeTile's hover-preview card iterate over. */
export const STAR_INDEXES = [1, 2, 3, 4, 5];

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
