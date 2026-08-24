import { useState } from "react";
import { STAR_INDEXES, starIconFor } from "../lib/rating";

/**
 * Letterboxd-style star rating: sweep across the row to preview, click to
 * commit immediately (no confirm), click the exact value you already have
 * to clear it back to unrated. Confirmed with Nick over several rounds of
 * screenshots -- see the plan this shipped under for the full back-and-forth.
 *
 * Each star is two stacked half-width, invisible hit targets over one
 * `<img>` -- not a single target with pointer-position math -- so the
 * left/right half-star split needs no coordinate calculation, and touch
 * gets a sensible default for free: a tap has no hover phase, so it just
 * fires the half it landed on straight through onClick.
 *
 * Opacity has three levels: 30% for any unlit star (the resting empty
 * state, and whatever a hover preview doesn't reach), 100% for a lit star
 * while actively hovering (the live preview), 80% for a lit star at rest
 * once a rating is saved and the pointer has moved on -- the exact
 * sweep -> click -> pull-away sequence Nick walked through.
 *
 * While hovering, the display is the hover preview ALONE, not blended with
 * the saved value -- sweeping from a 4-star rating down to hover over star
 * 2 shows only stars 1-2 lit, not a ghost of stars 3-4 from the old value.
 * The saved value only reappears once the pointer leaves the whole row.
 */
export function StarRating({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);
  const isHovering = hoverValue !== undefined;
  const displayValue = hoverValue ?? value ?? 0;

  function commit(star: number, half: boolean) {
    const clicked = half ? star - 0.5 : star;
    onChange(clicked === value ? undefined : clicked);
  }

  return (
    <div
      className="flex items-center gap-1 rounded-full bg-black/20 px-3 py-2"
      onMouseLeave={() => setHoverValue(undefined)}
    >
      {STAR_INDEXES.map((star) => {
        const lit = displayValue >= star - 0.5;
        const opacity = !lit ? 0.3 : isHovering ? 1 : 0.8;
        return (
          <div key={star} className="relative h-4 w-4">
            <img
              src={starIconFor(displayValue, star)}
              alt=""
              className="h-4 w-4"
              style={{ opacity }}
            />
            <button
              type="button"
              aria-label={`Rate ${star - 0.5} stars`}
              className="absolute inset-y-0 left-0 w-1/2"
              onMouseEnter={() => setHoverValue(star - 0.5)}
              onClick={() => commit(star, true)}
            />
            <button
              type="button"
              aria-label={`Rate ${star} stars`}
              className="absolute inset-y-0 right-0 w-1/2"
              onMouseEnter={() => setHoverValue(star)}
              onClick={() => commit(star, false)}
            />
          </div>
        );
      })}
    </div>
  );
}
